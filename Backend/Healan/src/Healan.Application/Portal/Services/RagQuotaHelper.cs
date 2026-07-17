using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Services;

public static class RagQuotaHelper
{
    public static DateTime UtcDayStart(DateTime utcNow) =>
        new(utcNow.Year, utcNow.Month, utcNow.Day, 0, 0, 0, DateTimeKind.Utc);

    public static async Task<int> CountTodayAsync(
        IApplicationDbContext db,
        Guid? identityUserId,
        string? guestKey,
        CancellationToken cancellationToken)
    {
        var from = UtcDayStart(DateTime.UtcNow);
        var query = db.RagChatLogs.AsNoTracking().Where(x => x.CreatedAt >= from);

        if (identityUserId.HasValue && identityUserId.Value != Guid.Empty)
            return await query.CountAsync(x => x.IdentityUserId == identityUserId.Value, cancellationToken);

        if (string.IsNullOrWhiteSpace(guestKey))
            return 0;

        var key = guestKey.Trim();
        return await query.CountAsync(x => x.GuestKey == key && x.IdentityUserId == null, cancellationToken);
    }

    public static (int Limit, int Used, int Remaining, bool RequiresLogin) Evaluate(
        RagSetting? setting,
        bool isAuthenticated,
        int used)
    {
        var limit = isAuthenticated
            ? Math.Max(1, setting?.AuthenticatedDailyLimit ?? 200)
            : Math.Max(0, setting?.GuestDailyLimit ?? 10);
        var remaining = Math.Max(0, limit - used);
        var requiresLogin = !isAuthenticated && remaining <= 0;
        return (limit, used, remaining, requiresLogin);
    }

    public static string ToAsciiDigits(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        var buffer = new char[value.Length];
        var n = 0;
        foreach (var ch in value)
        {
            if (ch >= '0' && ch <= '9')
                buffer[n++] = ch;
            else if (ch >= '۰' && ch <= '۹') // Persian
                buffer[n++] = (char)('0' + (ch - '۰'));
            else if (ch >= '٠' && ch <= '٩') // Arabic-Indic
                buffer[n++] = (char)('0' + (ch - '٠'));
        }

        return new string(buffer, 0, n);
    }

    public static string MaskPhone(string phone)
    {
        var digits = ToAsciiDigits(phone);
        if (digits.Length < 7)
            return "***";
        return $"{digits[..4]}***{digits[^3..]}";
    }

    public static string NormalizePhone(string? phone)
    {
        var digits = ToAsciiDigits(phone);
        if (digits.StartsWith("98") && digits.Length == 12)
            digits = "0" + digits[2..];
        if (digits.Length == 10 && digits.StartsWith("9"))
            digits = "0" + digits;
        return digits;
    }
}
