using System.Security.Cryptography;
using System.Text;
using StackExchange.Redis;
using TSEAI.Application.Usage;
using TSEAI.Domain.Settings;

namespace TSEAI.Infrastructure.Usage;

public sealed class RedisQuestionQuotaService(IConnectionMultiplexer redis, ISystemSettingService settings) : IQuestionQuotaService
{
    private static readonly TimeZoneInfo Tehran = ResolveTehran();

    public async Task<QuotaStatus> GetStatusAsync(string subject, bool authenticated, CancellationToken ct)
    {
        var now = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, Tehran);
        var date = DateOnly.FromDateTime(now.DateTime);
        var limit = Math.Max(0, await Limit(authenticated, ct));
        var value = await redis.GetDatabase().StringGetAsync(Key(subject, authenticated, date));
        var used = value.HasValue && int.TryParse(value.ToString(), out var n) ? n : 0;
        return new(limit, used, Math.Max(0, limit - used), date, authenticated);
    }

    public async Task<bool> TryReserveAsync(string subject, bool authenticated, CancellationToken ct)
    {
        var now = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, Tehran);
        var date = DateOnly.FromDateTime(now.DateTime);
        var limit = Math.Max(0, await Limit(authenticated, ct));
        if (limit == 0) return false;

        var ttl = now.Date.AddDays(1) - now.DateTime;
        const string lua = "local v=redis.call('GET',KEYS[1]); if v and tonumber(v)>=tonumber(ARGV[1]) then return 0 end; local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[2]) end; return 1";
        var result = (int)await redis.GetDatabase().ScriptEvaluateAsync(
            lua,
            new RedisKey[] { Key(subject, authenticated, date) },
            new RedisValue[] { limit, (long)Math.Max(1000, ttl.TotalMilliseconds) });
        return result == 1;
    }

    public async Task ReleaseAsync(string subject, bool authenticated, CancellationToken ct)
    {
        var now = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, Tehran);
        var key = Key(subject, authenticated, DateOnly.FromDateTime(now.DateTime));
        const string lua = "local v=redis.call('GET',KEYS[1]); if v and tonumber(v)>0 then return redis.call('DECR',KEYS[1]) end return 0";
        await redis.GetDatabase().ScriptEvaluateAsync(lua, new RedisKey[] { key }, Array.Empty<RedisValue>());
    }

    private Task<int> Limit(bool authenticated, CancellationToken ct) =>
        settings.GetIntAsync(authenticated ? SettingKeys.AuthenticatedDailyQuestionLimit : SettingKeys.AnonymousDailyQuestionLimit, authenticated ? 50 : 5, ct);

    private static RedisKey Key(string subject, bool authenticated, DateOnly date)
    {
        var subjectHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(subject ?? string.Empty)));
        return $"quota:question:{(authenticated ? "user" : "guest")}:{subjectHash}:{date:yyyyMMdd}";
    }

    private static TimeZoneInfo ResolveTehran()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Tehran"); }
        catch { return TimeZoneInfo.FindSystemTimeZoneById("Iran Standard Time"); }
    }
}
