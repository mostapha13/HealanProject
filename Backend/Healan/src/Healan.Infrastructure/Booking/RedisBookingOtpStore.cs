using Healan.Application.Booking.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Healan.Infrastructure.Booking;

public sealed class RedisBookingOtpStore : IBookingOtpStore, IDisposable
{
    private readonly IBookingOtpStore _fallback;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RedisBookingOtpStore> _logger;
    private readonly object _muxLock = new();
    private IConnectionMultiplexer? _mux;
    private bool _redisDisabled;

    public RedisBookingOtpStore(
        MemoryBookingOtpStore fallback,
        IConfiguration configuration,
        ILogger<RedisBookingOtpStore> logger)
    {
        _fallback = fallback;
        _configuration = configuration;
        _logger = logger;
    }

    private static string OtpKey(string phone) => $"booking:otp:{phone}";
    private static string CdKey(string phone) => $"booking:otp:cd:{phone}";
    private static string SessionKey(string token) => $"booking:session:{token}";

    public async Task SetAsync(string phone, string code, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var redis = TryGetDb();
        if (redis is not null)
        {
            try
            {
                await redis.StringSetAsync(OtpKey(phone), code, ttl);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis OTP set failed; using memory");
                DisableRedisTemporarily();
            }
        }

        await _fallback.SetAsync(phone, code, ttl, cancellationToken);
    }

    public async Task<(bool Found, string? Code)> TryGetAsync(string phone, CancellationToken cancellationToken = default)
    {
        var redis = TryGetDb();
        if (redis is not null)
        {
            try
            {
                var value = await redis.StringGetAsync(OtpKey(phone));
                if (value.HasValue)
                    return (true, value.ToString());
                return (false, null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis OTP get failed; using memory");
                DisableRedisTemporarily();
            }
        }

        return await _fallback.TryGetAsync(phone, cancellationToken);
    }

    public async Task RemoveAsync(string phone, CancellationToken cancellationToken = default)
    {
        var redis = TryGetDb();
        if (redis is not null)
        {
            try
            {
                await redis.KeyDeleteAsync(OtpKey(phone));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis OTP remove failed");
                DisableRedisTemporarily();
            }
        }

        await _fallback.RemoveAsync(phone, cancellationToken);
    }

    public async Task<bool> IsInCooldownAsync(string phone, CancellationToken cancellationToken = default)
    {
        var redis = TryGetDb();
        if (redis is not null)
        {
            try
            {
                return await redis.KeyExistsAsync(CdKey(phone));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis OTP cooldown check failed; using memory");
                DisableRedisTemporarily();
            }
        }

        return await _fallback.IsInCooldownAsync(phone, cancellationToken);
    }

    public async Task SetCooldownAsync(string phone, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var redis = TryGetDb();
        if (redis is not null)
        {
            try
            {
                await redis.StringSetAsync(CdKey(phone), "1", ttl);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis OTP cooldown set failed; using memory");
                DisableRedisTemporarily();
            }
        }

        await _fallback.SetCooldownAsync(phone, ttl, cancellationToken);
    }

    public async Task SetSessionAsync(string token, string phone, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var redis = TryGetDb();
        if (redis is not null)
        {
            try
            {
                await redis.StringSetAsync(SessionKey(token), phone, ttl);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis session set failed; using memory");
                DisableRedisTemporarily();
            }
        }

        await _fallback.SetSessionAsync(token, phone, ttl, cancellationToken);
    }

    public async Task<string?> GetSessionPhoneAsync(string token, CancellationToken cancellationToken = default)
    {
        var redis = TryGetDb();
        if (redis is not null)
        {
            try
            {
                var value = await redis.StringGetAsync(SessionKey(token));
                return value.HasValue ? value.ToString() : null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis session get failed; using memory");
                DisableRedisTemporarily();
            }
        }

        return await _fallback.GetSessionPhoneAsync(token, cancellationToken);
    }

    private IDatabase? TryGetDb()
    {
        if (_redisDisabled)
            return null;

        try
        {
            lock (_muxLock)
            {
                if (_mux is { IsConnected: true })
                    return _mux.GetDatabase();

                var hosts = _configuration.GetSection("Redis:Hosts").GetChildren().ToList();
                var password = _configuration["Redis:Password"];
                if (hosts.Count == 0)
                {
                    _redisDisabled = true;
                    return null;
                }

                var host = hosts[0]["Host"] ?? "redis";
                var port = hosts[0]["Port"] ?? "6379";
                var config = new ConfigurationOptions
                {
                    AbortOnConnectFail = false,
                    ConnectTimeout = 2000,
                    SyncTimeout = 2000,
                };
                config.EndPoints.Add($"{host}:{port}");
                if (!string.IsNullOrWhiteSpace(password))
                    config.Password = password;

                _mux = ConnectionMultiplexer.Connect(config);
                return _mux.GetDatabase();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis connect failed for booking OTP");
            DisableRedisTemporarily();
            return null;
        }
    }

    private void DisableRedisTemporarily() => _redisDisabled = true;

    public void Dispose() => _mux?.Dispose();
}
