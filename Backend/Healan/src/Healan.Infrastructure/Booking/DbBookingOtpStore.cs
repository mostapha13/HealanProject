using Healan.Application.Booking.Services;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Booking.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Healan.Infrastructure.Booking;

/// <summary>
/// SQL-backed OTP/session store so verify works across healan-webapi instances.
/// Falls back to in-memory when the table is missing or SQL is unavailable.
/// </summary>
public sealed class DbBookingOtpStore : IBookingOtpStore
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly MemoryBookingOtpStore _fallback;
    private readonly ILogger<DbBookingOtpStore> _logger;
    private volatile bool _dbDisabled;

    public DbBookingOtpStore(
        IServiceScopeFactory scopeFactory,
        MemoryBookingOtpStore fallback,
        ILogger<DbBookingOtpStore> logger)
    {
        _scopeFactory = scopeFactory;
        _fallback = fallback;
        _logger = logger;
    }

    private static string OtpKey(string phone) => $"otp:{phone}";
    private static string CdKey(string phone) => $"cd:{phone}";
    private static string SessionKey(string token) => $"session:{token}";

    public async Task SetAsync(string phone, string code, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        if (!await TryUpsertAsync(OtpKey(phone), code, ttl, cancellationToken))
            await _fallback.SetAsync(phone, code, ttl, cancellationToken);
    }

    public async Task<(bool Found, string? Code)> TryGetAsync(string phone, CancellationToken cancellationToken = default)
    {
        if (!_dbDisabled)
        {
            try
            {
                var value = await GetValidAsync(OtpKey(phone), cancellationToken);
                if (!string.IsNullOrWhiteSpace(value))
                    return (true, value);
                // Also check memory in case a previous write fell back.
            }
            catch (Exception ex)
            {
                DisableDb(ex, "get");
            }
        }

        return await _fallback.TryGetAsync(phone, cancellationToken);
    }

    public async Task RemoveAsync(string phone, CancellationToken cancellationToken = default)
    {
        if (!_dbDisabled)
        {
            try
            {
                await DeleteAsync(OtpKey(phone), cancellationToken);
            }
            catch (Exception ex)
            {
                DisableDb(ex, "remove");
            }
        }

        await _fallback.RemoveAsync(phone, cancellationToken);
    }

    public async Task<bool> IsInCooldownAsync(string phone, CancellationToken cancellationToken = default)
    {
        if (!_dbDisabled)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(await GetValidAsync(CdKey(phone), cancellationToken)))
                    return true;
            }
            catch (Exception ex)
            {
                DisableDb(ex, "cooldown-check");
            }
        }

        return await _fallback.IsInCooldownAsync(phone, cancellationToken);
    }

    public async Task SetCooldownAsync(string phone, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        if (ttl <= TimeSpan.Zero)
        {
            await ClearCooldownAsync(phone, cancellationToken);
            return;
        }

        if (!await TryUpsertAsync(CdKey(phone), "1", ttl, cancellationToken))
            await _fallback.SetCooldownAsync(phone, ttl, cancellationToken);
    }

    public async Task ClearCooldownAsync(string phone, CancellationToken cancellationToken = default)
    {
        if (!_dbDisabled)
        {
            try
            {
                await DeleteAsync(CdKey(phone), cancellationToken);
            }
            catch (Exception ex)
            {
                DisableDb(ex, "cooldown-clear");
            }
        }

        await _fallback.ClearCooldownAsync(phone, cancellationToken);
    }

    public async Task SetSessionAsync(string token, string phone, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        if (!await TryUpsertAsync(SessionKey(token), phone, ttl, cancellationToken))
            await _fallback.SetSessionAsync(token, phone, ttl, cancellationToken);
    }

    public async Task<string?> GetSessionPhoneAsync(string token, CancellationToken cancellationToken = default)
    {
        if (!_dbDisabled)
        {
            try
            {
                var value = await GetValidAsync(SessionKey(token), cancellationToken);
                if (!string.IsNullOrWhiteSpace(value))
                    return value;
            }
            catch (Exception ex)
            {
                DisableDb(ex, "session-get");
            }
        }

        return await _fallback.GetSessionPhoneAsync(token, cancellationToken);
    }

    private async Task<bool> TryUpsertAsync(string key, string value, TimeSpan ttl, CancellationToken cancellationToken)
    {
        if (_dbDisabled)
            return false;

        try
        {
            await UpsertAsync(key, value, ttl, cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            DisableDb(ex, "upsert");
            return false;
        }
    }

    private void DisableDb(Exception ex, string op)
    {
        _dbDisabled = true;
        _logger.LogWarning(
            ex,
            "BookingAuthTokens store failed on {Op}; using in-memory OTP store. Ensure migration AddBookingAuthTokens is applied.",
            op);
    }

    private async Task UpsertAsync(string key, string value, TimeSpan ttl, CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var now = DateTime.UtcNow;
        var row = await db.BookingAuthTokens.FirstOrDefaultAsync(x => x.TokenKey == key, cancellationToken);
        if (row is null)
        {
            db.BookingAuthTokens.Add(new BookingAuthToken
            {
                TokenKey = key,
                TokenValue = value,
                ExpiresAtUtc = now.Add(ttl),
            });
        }
        else
        {
            row.TokenValue = value;
            row.ExpiresAtUtc = now.Add(ttl);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<string?> GetValidAsync(string key, CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var now = DateTime.UtcNow;
        var row = await db.BookingAuthTokens.AsNoTracking()
            .FirstOrDefaultAsync(x => x.TokenKey == key, cancellationToken);
        if (row is null)
            return null;
        if (row.ExpiresAtUtc <= now)
        {
            await DeleteAsync(key, cancellationToken);
            return null;
        }

        return row.TokenValue;
    }

    private async Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var row = await db.BookingAuthTokens.FirstOrDefaultAsync(x => x.TokenKey == key, cancellationToken);
        if (row is null)
            return;
        db.BookingAuthTokens.Remove(row);
        await db.SaveChangesAsync(cancellationToken);
    }
}
