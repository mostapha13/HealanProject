using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Healan.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Healan.Application.Portal.Services;

public interface IPortalAuthTokenService
{
    string CreateToken(Guid userId, string phoneNumber, out DateTime expiresAtUtc);
    bool TryValidate(string? token, out Guid userId, out string phoneNumber);
}

public sealed class PortalAuthTokenService : IPortalAuthTokenService
{
    public const string TokenHoursSettingKey = "auth.tokenHours";

    private readonly byte[] _key;
    private readonly int _fallbackHours;
    private readonly IServiceScopeFactory _scopeFactory;

    public PortalAuthTokenService(IConfiguration configuration, IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
        var secret = configuration["PortalAuth:SigningKey"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
            secret = "HealanPortalAuthDevKey-ChangeMe-32chars!!";
        _key = Encoding.UTF8.GetBytes(secret);
        _fallbackHours = int.TryParse(configuration["PortalAuth:TokenHours"], out var h) ? h : 24;
    }

    public string CreateToken(Guid userId, string phoneNumber, out DateTime expiresAtUtc)
    {
        var lifetime = ResolveLifetime();
        expiresAtUtc = DateTime.UtcNow.Add(lifetime);
        var payload = JsonSerializer.Serialize(new Payload(userId, phoneNumber, expiresAtUtc.Ticks));
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        var payloadPart = Base64UrlEncode(payloadBytes);
        var sig = Base64UrlEncode(HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(payloadPart)));
        return $"{payloadPart}.{sig}";
    }

    public bool TryValidate(string? token, out Guid userId, out string phoneNumber)
    {
        userId = Guid.Empty;
        phoneNumber = string.Empty;
        if (string.IsNullOrWhiteSpace(token))
            return false;

        var parts = token.Trim().Split('.', 2);
        if (parts.Length != 2)
            return false;

        var expected = Base64UrlEncode(HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(parts[0])));
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expected),
                Encoding.UTF8.GetBytes(parts[1])))
            return false;

        try
        {
            var json = Encoding.UTF8.GetString(Base64UrlDecode(parts[0]));
            var payload = JsonSerializer.Deserialize<Payload>(json);
            if (payload == null || payload.ExpTicks < DateTime.UtcNow.Ticks || payload.UserId == Guid.Empty)
                return false;
            userId = payload.UserId;
            phoneNumber = payload.Phone ?? string.Empty;
            return true;
        }
        catch
        {
            return false;
        }
    }

    private TimeSpan ResolveLifetime()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var raw = db.PortalSiteSettings.AsNoTracking()
                .Where(x => x.SettingKey == TokenHoursSettingKey)
                .Select(x => x.SettingValue)
                .FirstOrDefault();
            if (int.TryParse(raw, out var hours) && hours > 0)
                return TimeSpan.FromHours(Math.Clamp(hours, 1, 24 * 90));
        }
        catch
        {
            // fall through to config default
        }

        return TimeSpan.FromHours(Math.Clamp(_fallbackHours, 1, 24 * 90));
    }

    private static string Base64UrlEncode(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string input)
    {
        var s = input.Replace('-', '+').Replace('_', '/');
        switch (s.Length % 4)
        {
            case 2: s += "=="; break;
            case 3: s += "="; break;
        }
        return Convert.FromBase64String(s);
    }

    private sealed record Payload(Guid UserId, string? Phone, long ExpTicks);
}
