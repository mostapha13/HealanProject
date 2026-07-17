using Healan.Application.Common.Interfaces;
using Healan.Domain.Booking.Entities;
using Healan.Domain.Booking.Enums;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Booking.Services;

public static class BookingTimeHelper
{
    public static TimeSpan ParseTime(string value)
    {
        var raw = (value ?? string.Empty).Trim();
        // SQL Server `time` cannot store 24:00 — map to end-of-day.
        if (raw is "24:00" or "24:00:00")
            return new TimeSpan(23, 59, 0);
        if (TimeSpan.TryParse(raw, out var ts))
        {
            if (ts >= TimeSpan.FromHours(24))
                return new TimeSpan(23, 59, 0);
            return ts;
        }
        throw new Share.Domain.Exceptions.BadRequestExceptions($"ساعت نامعتبر: {value}");
    }

    public static string FormatTime(TimeSpan ts)
    {
        // TimeSpan custom format has `hh` (0–23), NOT `HH` (DateTime-only) — `HH` throws FormatException.
        if (ts.Days > 0 || (ts.Hours == 23 && ts.Minutes >= 59))
            return "24:00";
        return ts.ToString(@"hh\:mm");
    }

    public static DateTime Combine(DateOnly date, TimeSpan time) =>
        date.ToDateTime(TimeOnly.FromTimeSpan(time));
}

/// <summary>تولید اسلات از قالب هفتگی / استثنا برای بازه تاریخ.</summary>
public static class AppointmentSlotGenerator
{
    public static async Task<int> GenerateAsync(
        IApplicationDbContext db,
        long doctorId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken)
    {
        if (to < from)
            (from, to) = (to, from);

        var templates = await db.DoctorScheduleTemplates
            .AsNoTracking()
            .Where(x => x.DoctorId == doctorId && x.IsActive)
            .ToListAsync(cancellationToken);

        var exceptions = await db.DoctorScheduleExceptions
            .AsNoTracking()
            .Where(x => x.DoctorId == doctorId && x.Date >= from && x.Date <= to)
            .ToDictionaryAsync(x => x.Date, cancellationToken);

        var existingStarts = await db.AppointmentSlots
            .Where(x => x.DoctorId == doctorId
                        && x.StartAt >= from.ToDateTime(TimeOnly.MinValue)
                        && x.StartAt < to.AddDays(1).ToDateTime(TimeOnly.MinValue))
            .Select(x => x.StartAt)
            .ToListAsync(cancellationToken);
        var existingSet = existingStarts.ToHashSet();

        var added = 0;
        for (var d = from; d <= to; d = d.AddDays(1))
        {
            TimeSpan start;
            TimeSpan end;
            int duration;

            if (exceptions.TryGetValue(d, out var ex))
            {
                if (ex.IsClosed)
                    continue;
                if (ex.StartTime is null || ex.EndTime is null)
                    continue;
                start = ex.StartTime.Value;
                end = ex.EndTime.Value;
                duration = ex.VisitDurationMinutes
                           ?? templates.FirstOrDefault(t => t.DayOfWeek == d.DayOfWeek)?.VisitDurationMinutes
                           ?? 30;
            }
            else
            {
                var template = templates.FirstOrDefault(t => t.DayOfWeek == d.DayOfWeek);
                if (template is null)
                    continue;
                start = template.StartTime;
                end = template.EndTime;
                duration = template.VisitDurationMinutes <= 0 ? 30 : template.VisitDurationMinutes;
            }

            if (duration <= 0 || end < start)
                continue;

            for (var cursor = start; cursor <= end; cursor = cursor.Add(TimeSpan.FromMinutes(duration)))
            {
                var startAt = BookingTimeHelper.Combine(d, cursor);
                if (existingSet.Contains(startAt))
                    continue;

                db.AppointmentSlots.Add(new AppointmentSlot
                {
                    DoctorId = doctorId,
                    StartAt = startAt,
                    EndAt = startAt.AddMinutes(duration),
                    Status = AppointmentSlotStatus.Open,
                    Source = AppointmentSlotSource.Generated,
                    CreatedAt = DateTime.UtcNow,
                });
                existingSet.Add(startAt);
                added++;
            }
        }

        if (added > 0)
            await db.SaveChangesAsync(cancellationToken);

        return added;
    }
}
