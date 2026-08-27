using System.Text.Json;
using StackExchange.Redis;
using TSEAI.Shared.Application.Alerts;
using TSEAI.Shared.Application.Market;

namespace TSEAI.MarketRuntime.Worker;

public sealed class RedisMarketSnapshotStore(IConnectionMultiplexer redis)
{
    public const string MarketChangeStream = "tseai:market:changes:v1";
    private const string SnapshotHash = "tseai:market:snapshot:v1";
    private const string CurrentDateKey = "tseai:market:current-trading-date:v1";
    private const string SyncStateHash = "tseai:market:sync-state:v1";
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task<MarketSymbolSnapshot> GetAsync(long insCode)
    {
        var raw = await _db.HashGetAsync(SnapshotHash, insCode);
        return raw.HasValue
            ? JsonSerializer.Deserialize<MarketSymbolSnapshot>(raw.ToString()) ?? new() { InsCode = insCode }
            : new() { InsCode = insCode };
    }

    public Task EnsureCurrentTradingDateAsync(int tradingDate) => _db.StringSetAsync(CurrentDateKey, tradingDate);

    public async Task<IReadOnlyDictionary<long, MarketSymbolSnapshot>> GetManyAsync(IEnumerable<long> insCodes)
    {
        var ids = insCodes.Distinct().ToArray();
        if (ids.Length == 0) return new Dictionary<long, MarketSymbolSnapshot>();

        var values = await _db.HashGetAsync(SnapshotHash, ids.Select(x => (RedisValue)x).ToArray());
        var result = new Dictionary<long, MarketSymbolSnapshot>(ids.Length);
        for (var index = 0; index < ids.Length; index++)
        {
            var raw = values[index];
            result[ids[index]] = raw.HasValue
                ? JsonSerializer.Deserialize<MarketSymbolSnapshot>(raw.ToString()) ?? new() { InsCode = ids[index] }
                : new() { InsCode = ids[index] };
        }
        return result;
    }

    public async Task<IReadOnlyDictionary<long, InstrumentReference>> GetInstrumentsByInsCodeAsync(IEnumerable<long> insCodes)
    {
        var ids = insCodes.Distinct().ToArray();
        if (ids.Length == 0) return new Dictionary<long, InstrumentReference>();

        var values = await _db.StringGetAsync(ids.Select(x => (RedisKey)$"tseai:instrument:inscode:{x}").ToArray());
        var result = new Dictionary<long, InstrumentReference>(ids.Length);
        for (var index = 0; index < ids.Length; index++)
        {
            if (!values[index].HasValue) continue;
            var value = JsonSerializer.Deserialize<InstrumentReference>(values[index].ToString());
            if (value is not null) result[ids[index]] = value;
        }
        return result;
    }

    public async Task ReconcileActiveUniverseAsync(int tradingDate, IEnumerable<long> insCodes)
    {
        var key = $"tseai:market:active:{tradingDate}:v1";
        var expected = insCodes.Distinct().Select(x => (RedisValue)x).ToArray();
        var expectedSet = expected.ToHashSet();
        var previousDateValue = await _db.StringGetAsync(CurrentDateKey);
        if (previousDateValue.HasValue && int.TryParse(previousDateValue.ToString(), out var previousDate) && previousDate != tradingDate)
        {
            var previousKey = $"tseai:market:active:{previousDate}:v1";
            var previousMembers = await _db.SetMembersAsync(previousKey);
            var obsolete = previousMembers.Where(x => !expectedSet.Contains(x)).ToArray();
            if (obsolete.Length > 0) await _db.HashDeleteAsync(SnapshotHash, obsolete);
            await _db.KeyDeleteAsync(previousKey);
        }

        var existing = await _db.SetMembersAsync(key);
        var stale = existing.Where(x => !expectedSet.Contains(x)).ToArray();
        if (stale.Length > 0)
        {
            await _db.SetRemoveAsync(key, stale);
            await _db.HashDeleteAsync(SnapshotHash, stale);
        }
        if (expected.Length > 0) await _db.SetAddAsync(key, expected);
        await _db.StringSetAsync(CurrentDateKey, tradingDate);
    }

    public async Task PutAsync(MarketSymbolSnapshot s, bool active = true)
    {
        s.SnapshotUpdatedAtUtc = DateTime.UtcNow;
        await _db.HashSetAsync(SnapshotHash, s.InsCode, JsonSerializer.Serialize(s));
        if (active && s.TradingDate > 0)
        {
            var current = await _db.StringGetAsync(CurrentDateKey);
            if (!current.HasValue || !int.TryParse(current.ToString(), out var d) || s.TradingDate >= d)
                await _db.StringSetAsync(CurrentDateKey, s.TradingDate);
            await _db.SetAddAsync($"tseai:market:active:{s.TradingDate}:v1", s.InsCode);
        }
    }

    public async Task PutManyAsync(IEnumerable<MarketSymbolSnapshot> snapshots)
    {
        var rows = snapshots.ToArray();
        if (rows.Length == 0) return;

        var now = DateTime.UtcNow;
        foreach (var row in rows) row.SnapshotUpdatedAtUtc = now;
        await _db.HashSetAsync(SnapshotHash, rows.Select(row =>
            new HashEntry(row.InsCode, JsonSerializer.Serialize(row))).ToArray());

        foreach (var group in rows.Where(x => x.TradingDate > 0).GroupBy(x => x.TradingDate))
        {
            await _db.SetAddAsync($"tseai:market:active:{group.Key}:v1", group.Select(x => (RedisValue)x.InsCode).ToArray());
        }
    }

    public async Task<MarketFeedSyncState?> GetFeedStateAsync(string feed)
    {
        var raw = await _db.HashGetAsync(SyncStateHash, NormalizeFeed(feed));
        return raw.HasValue ? JsonSerializer.Deserialize<MarketFeedSyncState>(raw.ToString()) : null;
    }

    public async Task BeginFeedSyncAsync(string feed, bool fullReconciliation)
    {
        var state = await GetFeedStateAsync(feed) ?? new() { Feed = NormalizeFeed(feed) };
        state.Status = "running";
        state.LastAttemptAtUtc = DateTime.UtcNow;
        state.LastAttemptWasFull = fullReconciliation;
        state.LastError = null;
        await SaveFeedStateAsync(state);
    }

    public async Task CompleteFeedSyncAsync(
        string feed,
        bool fullReconciliation,
        int rowCount,
        DateTime? watermark,
        DateTime? latestSourceCollectedAt)
    {
        var state = await GetFeedStateAsync(feed) ?? new() { Feed = NormalizeFeed(feed) };
        state.Status = "healthy";
        state.LastAttemptAtUtc ??= DateTime.UtcNow;
        state.LastSuccessAtUtc = DateTime.UtcNow;
        state.LastAttemptWasFull = fullReconciliation;
        state.LastReadRowCount = rowCount;
        if (fullReconciliation) state.LastFullRowCount = rowCount;
        if (watermark.HasValue) state.Watermark = watermark;
        if (latestSourceCollectedAt.HasValue) state.LatestSourceCollectedAt = latestSourceCollectedAt;
        state.LastError = null;
        await SaveFeedStateAsync(state);
    }

    public async Task FailFeedSyncAsync(string feed, bool fullReconciliation, Exception exception)
    {
        var state = await GetFeedStateAsync(feed) ?? new() { Feed = NormalizeFeed(feed) };
        state.Status = "failed";
        state.LastAttemptAtUtc ??= DateTime.UtcNow;
        state.LastFailureAtUtc = DateTime.UtcNow;
        state.LastAttemptWasFull = fullReconciliation;
        var error = $"{exception.GetType().Name}: {exception.Message}";
        state.LastError = error.Length <= 1000 ? error : error[..1000];
        await SaveFeedStateAsync(state);
    }

    public async Task<(bool Healthy, string Detail)> CheckHealthAsync()
    {
        var required = new[] { "cashmarket", "clienttype", "orderbookcurrent" };
        foreach (var feed in required)
        {
            var state = await GetFeedStateAsync(feed);
            if (state is null) return (false, $"{feed}:missing");
            if (state.Status == "failed") return (false, $"{feed}:failed");
            if (state.LastSuccessAtUtc is null) return (false, $"{feed}:never-succeeded");
        }
        return (true, "healthy");
    }

    public async Task PublishChangesAsync(int tradingDate, IReadOnlyDictionary<long, MarketChangeKind> changes)
    {
        if (changes.Count == 0) return;
        var batch = new MarketChangedBatch(
            Guid.NewGuid().ToString("N"),
            tradingDate,
            DateTime.UtcNow,
            changes.OrderBy(x => x.Key).Select(x => new MarketSymbolChange(x.Key, x.Value)).ToArray());
        var payload = JsonSerializer.Serialize(batch);
        await _db.StreamAddAsync(MarketChangeStream, [new NameValueEntry("payload", payload)], maxLength: 50000, useApproximateMaxLength: true);
    }

    public async Task PutInstrumentAsync(InstrumentReference i)
    {
        var raw = JsonSerializer.Serialize(i);
        await _db.StringSetAsync($"tseai:instrument:symbolcode:{i.SymbolCode}", raw);
        await _db.StringSetAsync($"tseai:instrument:inscode:{i.InsCode}", raw);
        await _db.StringSetAsync($"tseai:instrument:lookup:{Normalize(i.Symbol)}", i.SymbolCode);
        if (!string.IsNullOrWhiteSpace(i.SymbolName))
            await _db.StringSetAsync($"tseai:instrument:lookup:{Normalize(i.SymbolName)}", i.SymbolCode);
    }

    public async Task<InstrumentReference?> GetInstrumentByInsCode(long insCode)
    {
        var r = await _db.StringGetAsync($"tseai:instrument:inscode:{insCode}");
        return r.HasValue ? JsonSerializer.Deserialize<InstrumentReference>(r.ToString()) : null;
    }

    private static string Normalize(string s) => s.Trim().Replace('ي', 'ی').Replace('ك', 'ک').Replace("‌", "").Replace(" ", "").ToLowerInvariant();
    private static string NormalizeFeed(string feed) => feed.Trim().ToLowerInvariant();
    private Task SaveFeedStateAsync(MarketFeedSyncState state) =>
        _db.HashSetAsync(SyncStateHash, NormalizeFeed(state.Feed), JsonSerializer.Serialize(state));
}
