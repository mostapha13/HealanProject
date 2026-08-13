using Microsoft.Extensions.Options;
using TSEAI.Shared.Application.Alerts;

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
                if (DateTime.UtcNow - _lastInstrumentRefresh > TimeSpan.FromMinutes(_options.InstrumentRefreshMinutes))
                {
                    foreach (var instrument in await reader.ReadInstruments(stoppingToken))
                        await store.PutInstrumentAsync(instrument);
                    _lastInstrumentRefresh = DateTime.UtcNow;
                }

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

    private async Task Poll(int tradingDate, CancellationToken ct)
    {
        var changed = new Dictionary<long, MarketChangeKind>();
        static void Mark(Dictionary<long, MarketChangeKind> map, long insCode, MarketChangeKind kind)
            => map[insCode] = map.TryGetValue(insCode, out var current) ? current | kind : kind;

        var currentRows = await reader.ReadCurrent(_options.UseWatermark ? _currentWatermark : null, ct);
        var activeTradingDate = currentRows.Count > 0
            ? currentRows.Where(x => x.TradingDate > 0).Select(x => x.TradingDate).DefaultIfEmpty(tradingDate).Max()
            : tradingDate;
        if (currentRows.Count > 0)
            await store.EnsureCurrentTradingDateAsync(activeTradingDate);
        foreach (var row in currentRows)
        {
            var snapshot = await store.GetAsync(row.InsCode);
            var instrument = await store.GetInstrumentByInsCode(row.InsCode);

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
            await store.PutAsync(snapshot);
            Mark(changed, row.InsCode, MarketChangeKind.Current);
        }

        var currentTimes = currentRows.Where(x => x.LastModified.HasValue).Select(x => x.LastModified!.Value).ToArray();
        if (currentTimes.Length > 0) _currentWatermark = currentTimes.Max();

        var clientRows = await reader.ReadClientTypes(_options.UseWatermark ? _clientWatermark : null, ct);
        foreach (var row in clientRows)
        {
            var snapshot = await store.GetAsync(row.InsCode);
            // Client-type feeds can contain instruments outside the current cash
            // market universe. They may enrich a canonical snapshot, never create one.
            if (snapshot.TradingDate == 0) continue;
            snapshot.ClientType = new()
            {
                BuyCountI = row.BuyCountI,
                BuyCountN = row.BuyCountN,
                BuyIVolume = row.BuyIVolume,
                BuyNVolume = row.BuyNVolume,
                SellCountI = row.SellCountI,
                SellCountN = row.SellCountN,
                SellIVolume = row.SellIVolume,
                SellNVolume = row.SellNVolume
            };
            await store.PutAsync(snapshot, snapshot.TradingDate > 0);
            Mark(changed, row.InsCode, MarketChangeKind.ClientType);
        }
        var clientTimes = clientRows.Where(x => x.LastModified.HasValue).Select(x => x.LastModified!.Value).ToArray();
        if (clientTimes.Length > 0) _clientWatermark = clientTimes.Max();

        var orderBookRows = await reader.ReadOrderBook(_options.UseWatermark ? _bookWatermark : null, ct);
        foreach (var group in orderBookRows.GroupBy(x => x.InsCode))
        {
            var snapshot = await store.GetAsync(group.Key);
            // An order book without a current cash-market row is not an active
            // tradable snapshot and must not enter the filter universe.
            if (snapshot.TradingDate == 0) continue;
            foreach (var row in group.Where(x => x.Level is >= 1 and <= 5))
            {
                var index = row.Level - 1;
                snapshot.OrderBook[index] = new()
                {
                    Level = row.Level,
                    BuyPrice = row.BuyPrice,
                    BuyCount = row.BuyCount,
                    BuyVolume = row.BuyVolume,
                    SellPrice = row.SellPrice,
                    SellCount = row.SellCount,
                    SellVolume = row.SellVolume
                };
            }
            await store.PutAsync(snapshot, snapshot.TradingDate > 0);
            Mark(changed, group.Key, MarketChangeKind.OrderBook);
        }
        var bookTimes = orderBookRows.Where(x => x.LastModified.HasValue).Select(x => x.LastModified!.Value).ToArray();
        if (bookTimes.Length > 0) _bookWatermark = bookTimes.Max();

        await store.PublishChangesAsync(activeTradingDate, changed);
    }
}
