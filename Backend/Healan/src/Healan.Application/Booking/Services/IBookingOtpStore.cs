using Microsoft.Extensions.Caching.Memory;

namespace Healan.Application.Booking.Services;

public interface IBookingOtpStore
{
    Task SetAsync(string phone, string code, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task<(bool Found, string? Code)> TryGetAsync(string phone, CancellationToken cancellationToken = default);
    Task RemoveAsync(string phone, CancellationToken cancellationToken = default);
    Task<bool> IsInCooldownAsync(string phone, CancellationToken cancellationToken = default);
    Task SetCooldownAsync(string phone, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task ClearCooldownAsync(string phone, CancellationToken cancellationToken = default);
    Task SetSessionAsync(string token, string phone, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task<string?> GetSessionPhoneAsync(string token, CancellationToken cancellationToken = default);
}

/// <summary>Fallback in-process store when Redis is unavailable.</summary>
public sealed class MemoryBookingOtpStore : IBookingOtpStore
{
    private readonly IMemoryCache _cache;
    public MemoryBookingOtpStore(IMemoryCache cache) => _cache = cache;

    private static string OtpKey(string phone) => $"booking_otp_{phone}";
    private static string CdKey(string phone) => $"booking_otp_cd_{phone}";
    private static string SessionKey(string token) => $"booking_session_{token}";

    public Task SetAsync(string phone, string code, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        _cache.Set(OtpKey(phone), code, ttl);
        return Task.CompletedTask;
    }

    public Task<(bool Found, string? Code)> TryGetAsync(string phone, CancellationToken cancellationToken = default)
    {
        var found = _cache.TryGetValue(OtpKey(phone), out string? code) && !string.IsNullOrWhiteSpace(code);
        return Task.FromResult((found, code));
    }

    public Task RemoveAsync(string phone, CancellationToken cancellationToken = default)
    {
        _cache.Remove(OtpKey(phone));
        _cache.Remove($"booking_otp_meta_{phone}");
        return Task.CompletedTask;
    }

    public Task<bool> IsInCooldownAsync(string phone, CancellationToken cancellationToken = default) =>
        Task.FromResult(_cache.TryGetValue(CdKey(phone), out _));

    public Task SetCooldownAsync(string phone, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        if (ttl <= TimeSpan.Zero)
        {
            _cache.Remove(CdKey(phone));
            return Task.CompletedTask;
        }

        _cache.Set(CdKey(phone), true, ttl);
        return Task.CompletedTask;
    }

    public Task ClearCooldownAsync(string phone, CancellationToken cancellationToken = default)
    {
        _cache.Remove(CdKey(phone));
        return Task.CompletedTask;
    }

    public Task SetSessionAsync(string token, string phone, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        _cache.Set(SessionKey(token), phone, ttl);
        return Task.CompletedTask;
    }

    public Task<string?> GetSessionPhoneAsync(string token, CancellationToken cancellationToken = default)
    {
        _cache.TryGetValue(SessionKey(token), out string? phone);
        return Task.FromResult(phone);
    }
}
