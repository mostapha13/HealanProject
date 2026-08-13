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
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task<MarketSymbolSnapshot> GetAsync(long insCode)
    {
        var raw = await _db.HashGetAsync(SnapshotHash, insCode);
        return raw.HasValue
            ? JsonSerializer.Deserialize<MarketSymbolSnapshot>(raw.ToString()) ?? new() { InsCode = insCode }
            : new() { InsCode = insCode };
    }

    public Task EnsureCurrentTradingDateAsync(int tradingDate) => _db.StringSetAsync(CurrentDateKey, tradingDate);

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
}
