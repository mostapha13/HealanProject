using System.Globalization;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace TSEAI.MarketRuntime.Worker;

public sealed class TradingSessionPolicy(IConnectionMultiplexer redis, IOptions<MarketRuntimeOptions> options)
{
    private readonly IDatabase _db = redis.GetDatabase();
    private readonly MarketRuntimeOptions _options = options.Value;
    private static readonly TimeZoneInfo Tehran = Resolve();

    public async Task<(bool Open, int PollMs, int TradingDate)> CurrentAsync()
    {
        var enabled = await ReadBool("Market.IsEnabled", true);
        var start = await ReadTime("Market.StartTime", new TimeOnly(8, 30));
        var end = await ReadTime("Market.EndTime", new TimeOnly(12, 30));
        var poll = await ReadInt("Market.PollingIntervalMs", _options.PollIntervalMilliseconds);
        var now = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, Tehran);
        var time = TimeOnly.FromDateTime(now.DateTime);
        var inside = start <= end ? time >= start && time <= end : time >= start || time <= end;
        var tradingDate = int.Parse(now.ToString("yyyyMMdd", CultureInfo.InvariantCulture), CultureInfo.InvariantCulture);
        return (enabled && inside, Math.Clamp(poll, 250, 60000), tradingDate);
    }

    private async Task<TimeOnly> ReadTime(string key, TimeOnly fallback)
    {
        var value = await ReadSetting(key);
        return value.HasValue && TimeOnly.TryParse(value.ToString(), out var parsed) ? parsed : fallback;
    }

    private async Task<int> ReadInt(string key, int fallback)
    {
        var value = await ReadSetting(key);
        return value.HasValue && int.TryParse(value.ToString(), out var parsed) ? parsed : fallback;
    }

    private async Task<bool> ReadBool(string key, bool fallback)
    {
        var value = await ReadSetting(key);
        return value.HasValue && bool.TryParse(value.ToString(), out var parsed) ? parsed : fallback;
    }

    private async Task<RedisValue> ReadSetting(string key)
    {
        var redisKey = (RedisKey)("setting:" + key);
        var type = await _db.KeyTypeAsync(redisKey);
        return type switch
        {
            RedisType.Hash => await _db.HashGetAsync(redisKey, "data"),
            RedisType.String => await _db.StringGetAsync(redisKey),
            _ => RedisValue.Null
        };
    }

    private static TimeZoneInfo Resolve()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Tehran"); }
        catch { return TimeZoneInfo.FindSystemTimeZoneById("Iran Standard Time"); }
    }
}
