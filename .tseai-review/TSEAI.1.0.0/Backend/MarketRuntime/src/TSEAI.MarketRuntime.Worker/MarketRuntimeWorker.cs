using Microsoft.Extensions.Options;
using System.Text.Json;
using TSEAI.Shared.Application.Alerts;
using TSEAI.Shared.Application.Market;

namespace TSEAI.MarketRuntime.Worker;

public sealed class MarketRuntimeWorker(
    MarketDbReader reader,
    RedisMarketSnapshotStore store,
    TradingSessionPolicy session,
    IOptions<MarketRuntimeOptions> options,
    ILogger<MarketRuntimeWorker> log) : BackgroundService
{
    private readonly MarketRuntimeOptions _options = options.Value;
    private DateTime? _currentWatermark;
    private DateTime? _clientWatermark;
    private DateTime? _bookWatermark;
    private DateTime _lastInstrumentRefresh = DateTime.MinValue;
    private DateTime _lastInstrumentRefreshAttempt = DateTime.MinValue;
    private DateTime _lastFullReconciliationUtc = DateTime.MinValue;
    private bool _hydrated;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            log.LogWarning("Market runtime disabled");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RefreshInstrumentsIfDue(stoppingToken);

                var state = await session.CurrentAsync();
                if (!_hydrated)
                {
                    await Poll(state.TradingDate, stoppingToken);
                    _hydrated = true;
                }
                if (!state.Open)
                {
                    await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
                    continue;
                }

                await Poll(state.TradingDate, stoppingToken);
                await Task.Delay(state.PollMs, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex)
            {
                log.LogError(ex, "Market polling failed");
                await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
            }
        }
    }

    private async Task RefreshInstrumentsIfDue(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var refreshDue = now - _lastInstrumentRefresh > TimeSpan.FromMinutes(Math.Max(1, _options.InstrumentRefreshMinutes));
        var retryDue = now - _lastInstrumentRefreshAttempt > TimeSpan.FromSeconds(Math.Max(5, _options.InstrumentRetrySeconds));
        if (!refreshDue || !retryDue) return;

        _lastInstrumentRefreshAttempt = now;
        try
        {
            var instruments = await reader.ReadInstruments(ct);
            foreach (var instrument in instruments)
                await store.PutInstrumentAsync(instrument);
            _lastInstrumentRefresh = DateTime.UtcNow;
            log.LogInformation("Instrument reference cache refreshed with {Count} rows", instruments.Count);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception exception)
        {
            // Instrument metadata enriches snapshots, but its refresh must not
            // block price/order-book polling. Existing Redis references remain
            // usable until the independent retry succeeds.
            log.LogWarning(exception,
                "Instrument reference refresh failed; market polling continues and retry is scheduled in {RetrySeconds}s",
                Math.Max(5, _options.InstrumentRetrySeconds));
        }
    }

    private async Task Poll(int tradingDate, CancellationToken ct)
    {
        var fullReconciliation = !_hydrated ||
            DateTime.UtcNow - _lastFullReconciliationUtc >= TimeSpan.FromSeconds(Math.Max(5, _options.FullReconciliationSeconds));
        var attemptedFeeds = new List<string>(3);

        try
        {
            var previousCurrentState = await store.GetFeedStateAsync("cashmarket");
            var previousOrderBookState = await store.GetFeedStateAsync("orderbookcurrent");

            await Begin("cashmarket");
            var currentRows = await reader.ReadCurrent(
                _options.UseWatermark && !fullReconciliation ? _currentWatermark : null, ct);
            var canonicalCurrentRows = currentRows
                .GroupBy(x => x.InsCode)
                .Select(x => x.OrderByDescending(row => row.LastModified).First())
                .ToArray();

            if (fullReconciliation && !MarketReconciliationPolicy.IsSafe(
                    canonicalCurrentRows.Length,
                    previousCurrentState?.LastFullRowCount ?? 0,
                    _options.MinimumCurrentSnapshotRows,
                    _options.MinimumReconciliationCoveragePercent,
                    out var currentReason))
                throw new InvalidDataException($"Unsafe Cashmarket full reconciliation rejected: {currentReason}");

            await Begin("clienttype");
            var clientRows = await reader.ReadClientTypes(
                _options.UseWatermark && !fullReconciliation ? _clientWatermark : null, ct);

            await Begin("orderbookcurrent");
            var orderBookRows = await reader.ReadOrderBook(
                _options.UseWatermark && !fullReconciliation ? _bookWatermark : null, ct);
            if (fullReconciliation && !MarketReconciliationPolicy.IsSafe(
                    orderBookRows.Count,
                    previousOrderBookState?.LastFullRowCount ?? 0,
                    _options.MinimumOrderBookSnapshotRows,
                    _options.MinimumReconciliationCoveragePercent,
                    out var orderBookReason))
                throw new InvalidDataException($"Unsafe OrderBookCurrent full reconciliation rejected: {orderBookReason}");

            var affectedCodes = canonicalCurrentRows.Select(x => x.InsCode)
                .Concat(clientRows.Select(x => x.InsCode))
                .Concat(orderBookRows.Select(x => x.InsCode))
                .Distinct()
                .ToArray();
            var snapshots = (await store.GetManyAsync(affectedCodes)).ToDictionary(x => x.Key, x => x.Value);
            var before = snapshots.ToDictionary(x => x.Key, x => JsonSerializer.Serialize(x.Value));
            var instruments = await store.GetInstrumentsByInsCodeAsync(canonicalCurrentRows.Select(x => x.InsCode));
            var candidateChanges = new Dictionary<long, MarketChangeKind>();
            static void Mark(Dictionary<long, MarketChangeKind> map, long insCode, MarketChangeKind kind)
                => map[insCode] = map.TryGetValue(insCode, out var current) ? current | kind : kind;

            var activeTradingDate = canonicalCurrentRows.Length > 0
                ? canonicalCurrentRows.Where(x => x.TradingDate > 0).Select(x => x.TradingDate).DefaultIfEmpty(tradingDate).Max()
                : tradingDate;
            if (canonicalCurrentRows.Length > 0)
            {
                if (fullReconciliation)
                    await store.ReconcileActiveUniverseAsync(activeTradingDate, canonicalCurrentRows.Select(x => x.InsCode));
                else
                    await store.EnsureCurrentTradingDateAsync(activeTradingDate);
            }

            foreach (var row in canonicalCurrentRows)
            {
                var snapshot = snapshots[row.InsCode];
                instruments.TryGetValue(row.InsCode, out var instrument);
                ApplyCurrent(snapshot, row, instrument);
                Mark(candidateChanges, row.InsCode, MarketChangeKind.Current);
            }

            foreach (var row in clientRows)
            {
                var snapshot = snapshots[row.InsCode];
                // Client-type feeds may enrich an active canonical snapshot, never create one.
                if (snapshot.TradingDate == 0) continue;
                snapshot.ClientType = new()
                {
                    Counter = row.Counter,
                    UpdatedAt = row.UpdatedAt,
                    SourceCollectedAt = row.SourceCollectedAt,
                    BuyCountI = row.BuyCountI,
                    BuyCountN = row.BuyCountN,
                    BuyIVolume = row.BuyIVolume,
                    BuyNVolume = row.BuyNVolume,
                    SellCountI = row.SellCountI,
                    SellCountN = row.SellCountN,
                    SellIVolume = row.SellIVolume,
                    SellNVolume = row.SellNVolume
                };
                Mark(candidateChanges, row.InsCode, MarketChangeKind.ClientType);
            }

            if (fullReconciliation)
            {
                // A full OrderBookCurrent read is authoritative. Reset every active
                // symbol first so deleted levels and deleted books cannot linger.
                foreach (var snapshot in snapshots.Values.Where(x => x.TradingDate > 0))
                {
                    ResetOrderBook(snapshot);
                    Mark(candidateChanges, snapshot.InsCode, MarketChangeKind.OrderBook);
                }
            }

            foreach (var group in orderBookRows.GroupBy(x => x.InsCode))
            {
                var snapshot = snapshots[group.Key];
                if (snapshot.TradingDate == 0) continue;
                foreach (var row in group.Where(x => x.Level is >= 1 and <= 5))
                {
                    snapshot.OrderBook[row.Level - 1] = new()
                    {
                        Level = row.Level,
                        BestLimitCounter = row.BestLimitCounter,
                        BuyPrice = row.BuyPrice,
                        BuyCount = row.BuyCount,
                        BuyVolume = row.BuyVolume,
                        SellPrice = row.SellPrice,
                        SellCount = row.SellCount,
                        SellVolume = row.SellVolume
                    };
                }
                snapshot.OrderBookUpdatedAt = MaxDate(group.Select(x => x.OrderBookUpdatedAt));
                snapshot.OrderBookSourceCollectedAt = MaxDate(group.Select(x => x.SourceCollectedAt));
                ApplyBestOrderBookLevel(snapshot);
                Mark(candidateChanges, group.Key, MarketChangeKind.OrderBook);
            }

            var changed = candidateChanges
                .Where(x => before.TryGetValue(x.Key, out var oldValue) && oldValue != JsonSerializer.Serialize(snapshots[x.Key]))
                .ToDictionary(x => x.Key, x => x.Value);
            await store.PutManyAsync(changed.Keys.Select(x => snapshots[x]));
            await store.PublishChangesAsync(activeTradingDate, changed);

            var currentMax = MaxDate(currentRows.Select(x => x.LastModified));
            var clientMax = MaxDate(clientRows.Select(x => x.LastModified));
            var bookMax = MaxDate(orderBookRows.Select(x => x.LastModified));
            if (currentMax.HasValue || fullReconciliation) _currentWatermark = currentMax;
            if (clientMax.HasValue || fullReconciliation) _clientWatermark = clientMax;
            if (bookMax.HasValue || fullReconciliation) _bookWatermark = bookMax;

            await store.CompleteFeedSyncAsync("cashmarket", fullReconciliation, canonicalCurrentRows.Length, _currentWatermark, currentMax);
            await store.CompleteFeedSyncAsync("clienttype", fullReconciliation, clientRows.Count, _clientWatermark, clientMax);
            await store.CompleteFeedSyncAsync("orderbookcurrent", fullReconciliation, orderBookRows.Count, _bookWatermark, bookMax);
            if (fullReconciliation) _lastFullReconciliationUtc = DateTime.UtcNow;

            const string pollMessage = "Market poll completed: mode={Mode}, current={CurrentRows}, client={ClientRows}, orderBook={OrderBookRows}, changed={ChangedRows}, sourceCurrent={CurrentSource}, sourceOrderBook={OrderBookSource}";
            var pollArguments = new object?[]
            {
                fullReconciliation ? "full" : "incremental",
                canonicalCurrentRows.Length,
                clientRows.Count,
                orderBookRows.Count,
                changed.Count,
                currentMax,
                bookMax
            };
            if (fullReconciliation || changed.Count > 0)
                log.LogInformation(pollMessage, pollArguments);
            else
                log.LogDebug(pollMessage, pollArguments);

            async Task Begin(string feed)
            {
                attemptedFeeds.Add(feed);
                await store.BeginFeedSyncAsync(feed, fullReconciliation);
            }
        }
        catch (Exception exception)
        {
            foreach (var feed in attemptedFeeds)
            {
                try { await store.FailFeedSyncAsync(feed, fullReconciliation, exception); }
                catch (Exception stateException) { log.LogWarning(stateException, "Failed to persist {Feed} sync failure state", feed); }
            }
            throw;
        }
    }

    private static DateTime? MaxDate(IEnumerable<DateTime?> values)
    {
        var materialized = values.Where(x => x.HasValue).Select(x => x!.Value).ToArray();
        return materialized.Length == 0 ? null : materialized.Max();
    }

    private static void ResetOrderBook(MarketSymbolSnapshot snapshot)
    {
        snapshot.OrderBook = Enumerable.Range(1, 5).Select(i => new OrderBookLevel { Level = i }).ToArray();
        snapshot.OrderBookUpdatedAt = null;
        snapshot.OrderBookSourceCollectedAt = null;
        snapshot.BestBidPrice = null;
        snapshot.BestBidQuantity = null;
        snapshot.BestBidCount = null;
        snapshot.BestAskPrice = null;
        snapshot.BestAskQuantity = null;
        snapshot.BestAskCount = null;
    }

    private static void ApplyBestOrderBookLevel(MarketSymbolSnapshot snapshot)
    {
        var best = snapshot.OrderBook.FirstOrDefault(x => x.Level == 1);
        snapshot.BestBidPrice = best is not null && best.BuyPrice > 0 ? best.BuyPrice : null;
        snapshot.BestBidQuantity = best is not null && best.BuyPrice > 0 ? best.BuyVolume : null;
        snapshot.BestBidCount = best is not null && best.BuyPrice > 0 ? best.BuyCount : null;
        snapshot.BestAskPrice = best is not null && best.SellPrice > 0 ? best.SellPrice : null;
        snapshot.BestAskQuantity = best is not null && best.SellPrice > 0 ? best.SellVolume : null;
        snapshot.BestAskCount = best is not null && best.SellPrice > 0 ? best.SellCount : null;
    }

    private static void ApplyCurrent(MarketSymbolSnapshot snapshot, CurrentMarketRow row, InstrumentReference? instrument)
    {
        snapshot.TsetmcSymbol = row.Symbol;
        snapshot.TsetmcName = row.SymbolName;
        if (instrument is not null)
        {
            snapshot.SymbolCode = instrument.SymbolCode;
            snapshot.Symbol = instrument.Symbol;
            snapshot.SymbolName = instrument.SymbolName ?? row.SymbolName;
            snapshot.CompanyName = instrument.CompanyName;
            snapshot.MarketTypeId = instrument.MarketTypeId;
            snapshot.Investment = instrument.Investment;
        }
        else
        {
            snapshot.Symbol = row.Symbol;
            snapshot.SymbolName = row.SymbolName;
        }

        snapshot.TradingDate = row.TradingDate;
        snapshot.EventTime = row.EventTime;
        snapshot.TradeCount = row.TradeCount;
        snapshot.TradeVolume = row.TradeVolume;
        snapshot.TradeValue = row.TradeValue;
        snapshot.ClosingPrice = row.ClosingPrice;
        snapshot.LastPrice = row.LastPrice;
        snapshot.PriceChange = row.PriceChange;
        snapshot.SourceLastPricePercent = row.LastPricePercent;
        snapshot.SourceClosingPriceChange = row.ClosingPriceChange;
        snapshot.SourceClosingPricePercent = row.ClosingPricePercent;
        snapshot.MinPrice = row.MinPrice;
        snapshot.MaxPrice = row.MaxPrice;
        snapshot.FirstPrice = row.FirstPrice;
        snapshot.YesterdayPrice = row.YesterdayPrice;
        snapshot.RawMinValue = row.RawMinValue;
        snapshot.RawMaxValue = row.RawMaxValue;
        snapshot.EffectOnIndex = row.EffectOnIndex;
        snapshot.BestAskPrice = row.BestAskPrice;
        snapshot.BestAskQuantity = row.BestAskQuantity;
        snapshot.BestAskCount = row.BestAskCount;
        snapshot.BestBidPrice = row.BestBidPrice;
        snapshot.BestBidQuantity = row.BestBidQuantity;
        snapshot.BestBidCount = row.BestBidCount;
        snapshot.MarketId = row.MarketId;
        snapshot.MarketName = row.MarketName;
        snapshot.MarketTypeCode = row.MarketTypeCode;
        snapshot.MarketTypeName = row.MarketTypeName;
        snapshot.BoardId = row.BoardId;
        snapshot.BoardName = row.BoardName;
        snapshot.IndustryName = row.IndustryName;
        snapshot.IndustrySubId = row.IndustrySubId;
        snapshot.IndustrySubName = row.IndustrySubName;
        snapshot.SecuritiesId = row.SecuritiesId;
        snapshot.SecuritiesName = row.SecuritiesName;
        snapshot.StateId = row.StateId;
        snapshot.StateName = row.StateName;
        snapshot.Eps = row.Eps;
        snapshot.PE = row.PE;
        snapshot.MinAllowedPrice = row.MinAllowedPrice;
        snapshot.MaxAllowedPrice = row.MaxAllowedPrice;
        snapshot.SharesCount = row.SharesCount;
        snapshot.MarketValue = row.MarketValue;
        snapshot.BaseVolume = row.BaseVolume;
        snapshot.IndustryCode = row.IndustryCode;
        snapshot.OpenPositions = row.OpenPositions;
        snapshot.NavCancellation = row.NavCancellation;
        snapshot.SourceLastModified = row.LastModified;
    }
}
