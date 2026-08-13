using System.Text.Json;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using TSEAI.Shared.Application.Alerts;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Alert.Worker;

public sealed class AlertRedisStore(IConnectionMultiplexer redis, IOptions<AlertEngineOptions> options)
{
    private const string SnapshotHash = "tseai:market:snapshot:v1";
    private readonly IDatabase _db = redis.GetDatabase();
    private readonly AlertEngineOptions _options = options.Value;
    private readonly string _consumerName = string.IsNullOrWhiteSpace(options.Value.ConsumerName)
        ? $"{Environment.MachineName}-{Guid.NewGuid():N}"
        : options.Value.ConsumerName.Trim();

    private const string TransitionScript = """
local previous = redis.call('GET', KEYS[1])
local current = ARGV[1]
local stateTtl = tonumber(ARGV[2])
local cooldown = tonumber(ARGV[3])
if not previous then
  redis.call('SET', KEYS[1], current, 'EX', stateTtl)
  return 0
end
if previous == current then
  redis.call('EXPIRE', KEYS[1], stateTtl)
  return 0
end
redis.call('SET', KEYS[1], current, 'EX', stateTtl)
if current == '1' then
  if cooldown <= 0 then return 1 end
  local ok = redis.call('SET', KEYS[2], '1', 'EX', cooldown, 'NX')
  if ok then return 1 end
end
return 0
""";

    public async Task EnsureConsumerGroupAsync()
    {
        try
        {
            await _db.StreamCreateConsumerGroupAsync(_options.StreamKey, _options.ConsumerGroup, "$", createStream: true);
        }
        catch (RedisServerException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase)) { }
    }

    public Task<StreamEntry[]> ReadOwnPendingAsync() =>
        _db.StreamReadGroupAsync(_options.StreamKey, _options.ConsumerGroup, _consumerName, "0-0", _options.StreamReadCount);

    public async Task<StreamEntry[]> ReclaimAbandonedAsync()
    {
        var claimed = await _db.StreamAutoClaimAsync(
            _options.StreamKey,
            _options.ConsumerGroup,
            _consumerName,
            Math.Max(1000, _options.PendingClaimIdleMilliseconds),
            "0-0",
            Math.Clamp(_options.StreamReadCount, 1, 500));
        return claimed.ClaimedEntries;
    }

    public Task<StreamEntry[]> ReadNewAsync() =>
        _db.StreamReadGroupAsync(_options.StreamKey, _options.ConsumerGroup, _consumerName, ">", _options.StreamReadCount);

    public Task AcknowledgeAsync(RedisValue messageId) =>
        _db.StreamAcknowledgeAsync(_options.StreamKey, _options.ConsumerGroup, messageId);

    public static MarketChangedBatch? ParseBatch(StreamEntry entry)
    {
        var raw = entry.Values.FirstOrDefault(x => x.Name == "payload").Value;
        return raw.IsNullOrEmpty ? null : JsonSerializer.Deserialize<MarketChangedBatch>(raw.ToString());
    }

    public async Task<IReadOnlyDictionary<long, MarketSymbolSnapshot>> GetSnapshotsAsync(IEnumerable<long> insCodes)
    {
        var ids = insCodes.Distinct().ToArray();
        if (ids.Length == 0) return new Dictionary<long, MarketSymbolSnapshot>();
        var values = await _db.HashGetAsync(SnapshotHash, ids.Select(x => (RedisValue)x).ToArray());
        var result = new Dictionary<long, MarketSymbolSnapshot>(ids.Length);
        for (var i = 0; i < ids.Length; i++)
        {
            if (!values[i].HasValue) continue;
            var item = JsonSerializer.Deserialize<MarketSymbolSnapshot>(values[i].ToString());
            if (item is not null) result[ids[i]] = item;
        }
        return result;
    }

    public async Task<bool> TryTransitionAsync(Guid alertRuleId, int filterVersion, int tradingDate, long insCode, bool current, int cooldownSeconds)
    {
        var stateKey = (RedisKey)$"tseai:alert:state:{alertRuleId:N}:{filterVersion}:{tradingDate}:{insCode}";
        var cooldownKey = (RedisKey)$"tseai:alert:cooldown:{alertRuleId:N}:{insCode}";
        var result = await _db.ScriptEvaluateAsync(TransitionScript,
            [stateKey, cooldownKey],
            [current ? "1" : "0", Math.Max(60, _options.StateTtlSeconds), Math.Max(0, cooldownSeconds)]);
        return long.TryParse(result.ToString(), out var code) && code == 1;
    }

    public async Task RollbackTriggerAsync(Guid alertRuleId, int filterVersion, int tradingDate, long insCode)
    {
        var stateKey = (RedisKey)$"tseai:alert:state:{alertRuleId:N}:{filterVersion}:{tradingDate}:{insCode}";
        var cooldownKey = (RedisKey)$"tseai:alert:cooldown:{alertRuleId:N}:{insCode}";
        await _db.StringSetAsync(stateKey, "0", TimeSpan.FromSeconds(Math.Max(60, _options.StateTtlSeconds)));
        await _db.KeyDeleteAsync(cooldownKey);
    }
}
