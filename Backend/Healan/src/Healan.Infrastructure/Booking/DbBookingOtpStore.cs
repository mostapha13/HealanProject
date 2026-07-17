using Healan.Application.Booking.Services;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Booking.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Healan.Infrastructure.Booking;

/// <summary>SQL-backed OTP/session store so verify works across all healan-webapi instances.</summary>
public sealed class DbBookingOtpStore : IBookingOtpStore
{
    private readonly IServiceScopeFactory _scopeFactory;

    public DbBookingOtpStore(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    private static string OtpKey(string phone) => $"otp:{phone}";
    private static string CdKey(string phone) => $"cd:{phone}";
    private static string SessionKey(string token) => $"session:{token}";

    public Task SetAsync(string phone, string code, TimeSpan ttl, CancellationToken cancellationToken = default) =>
        UpsertAsync(OtpKey(phone), code, ttl, cancellationToken);

    public async Task<(bool Found, string? Code)> TryGetAsync(string phone, CancellationToken cancellationToken = default)
    {
        var value = await GetValidAsync(OtpKey(phone), cancellationToken);
        return string.IsNullOrWhiteSpace(value) ? (false, null) : (true, value);
    }

    public Task RemoveAsync(string phone, CancellationToken cancellationToken = default) =>
        DeleteAsync(OtpKey(phone), cancellationToken);

    public async Task<bool> IsInCooldownAsync(string phone, CancellationToken cancellationToken = default) =>
        !string.IsNullOrWhiteSpace(await GetValidAsync(CdKey(phone), cancellationToken));

    public Task SetCooldownAsync(string phone, TimeSpan ttl, CancellationToken cancellationToken = default) =>
        UpsertAsync(CdKey(phone), "1", ttl, cancellationToken);

    public Task SetSessionAsync(string token, string phone, TimeSpan ttl, CancellationToken cancellationToken = default) =>
        UpsertAsync(SessionKey(token), phone, ttl, cancellationToken);

    public Task<string?> GetSessionPhoneAsync(string token, CancellationToken cancellationToken = default) =>
        GetValidAsync(SessionKey(token), cancellationToken);

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
