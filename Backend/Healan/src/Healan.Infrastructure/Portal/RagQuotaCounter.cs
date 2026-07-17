using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Healan.Infrastructure.Portal;

/// <summary>
/// شمارنده سقف روزانه RAG با Redis؛ در صورت قطعی Redis از شمارش جدول SQL استفاده می‌کند.
/// </summary>
public sealed class RagQuotaCounter : IRagQuotaCounter, IDisposable
{
    private readonly IApplicationDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RagQuotaCounter> _logger;
    private readonly object _muxLock = new();
    private IConnectionMultiplexer? _mux;
    private bool _redisDisabled;

    public RagQuotaCounter(
        IApplicationDbContext db,
        IConfiguration configuration,
        ILogger<RagQuotaCounter> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<int> GetUsedTodayAsync(Guid? identityUserId, string? guestKey, CancellationToken cancellationToken)
    {
        var key = BuildKey(identityUserId, guestKey);
        if (key is null)
            return 0;

        var redis = TryGetDb();
        if (redis is not null)
        {
            try
            {
                var value = await redis.StringGetAsync(key);
                if (value.HasValue && int.TryParse(value.ToString(), out var cached))
                    return Math.Max(0, cached);

                var fromDb = await RagQuotaHelper.CountTodayAsync(_db, identityUserId, guestKey, cancellationToken);
                await redis.StringSetAsync(key, fromDb, TtlUntilUtcDayEnd());
                return fromDb;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis get quota failed; falling back to SQL");
                DisableRedisTemporarily();
            }
        }

        return await RagQuotaHelper.CountTodayAsync(_db, identityUserId, guestKey, cancellationToken);
    }

    public async Task<int> IncrementTodayAsync(Guid? identityUserId, string? guestKey, CancellationToken cancellationToken)
    {
        var key = BuildKey(identityUserId, guestKey);
        if (key is null)
            return 0;

        var redis = TryGetDb();
        if (redis is not null)
        {
            try
            {
                if (!await redis.KeyExistsAsync(key))
                {
                    var fromDb = await RagQuotaHelper.CountTodayAsync(_db, identityUserId, guestKey, cancellationToken);
                    await redis.StringSetAsync(key, fromDb, TtlUntilUtcDayEnd());
                }

                var next = await redis.StringIncrementAsync(key);
                await redis.KeyExpireAsync(key, TtlUntilUtcDayEnd());
                return (int)Math.Max(0, next);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis incr quota failed; falling back to SQL count+1");
                DisableRedisTemporarily();
            }
        }

        var used = await RagQuotaHelper.CountTodayAsync(_db, identityUserId, guestKey, cancellationToken);
        return used + 1;
    }

    private IDatabase? TryGetDb()
    {
        if (_redisDisabled)
            return null;
        if (!_configuration.GetValue("Redis:Enabled", true))
            return null;

        try
        {
            var mux = EnsureMultiplexer();
            return mux?.GetDatabase();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis connection unavailable for RAG quota");
            DisableRedisTemporarily();
            return null;
        }
    }

    private IConnectionMultiplexer? EnsureMultiplexer()
    {
        if (_mux is { IsConnected: true })
            return _mux;

        lock (_muxLock)
        {
            if (_mux is { IsConnected: true })
                return _mux;

            var host = _configuration["Redis:Hosts:0:Host"] ?? "localhost";
            var port = _configuration.GetValue("Redis:Hosts:0:Port", 6379);
            var options = new ConfigurationOptions
            {
                AbortOnConnectFail = false,
                ConnectTimeout = _configuration.GetValue("Redis:ConnectTimeout", 3000),
                SyncTimeout = _configuration.GetValue("Redis:ConnectTimeout", 3000),
            };
            options.EndPoints.Add(host, port);
            _mux = ConnectionMultiplexer.Connect(options);
            return _mux;
        }
    }

    private void DisableRedisTemporarily()
    {
        _redisDisabled = true;
    }

    private static string? BuildKey(Guid? identityUserId, string? guestKey)
    {
        var day = DateTime.UtcNow.ToString("yyyyMMdd");
        if (identityUserId is { } uid && uid != Guid.Empty)
            return $"rag:quota:u:{uid:N}:{day}";
        if (!string.IsNullOrWhiteSpace(guestKey))
            return $"rag:quota:g:{guestKey.Trim()}:{day}";
        return null;
    }

    private static TimeSpan TtlUntilUtcDayEnd()
    {
        var now = DateTime.UtcNow;
        var end = now.Date.AddDays(1).AddMinutes(5);
        var ttl = end - now;
        return ttl < TimeSpan.FromMinutes(5) ? TimeSpan.FromHours(24) : ttl;
    }

    public void Dispose()
    {
        _mux?.Dispose();
    }
}
