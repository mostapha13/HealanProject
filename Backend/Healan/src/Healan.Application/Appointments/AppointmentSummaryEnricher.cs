using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Appointments;

internal static class AppointmentSummaryEnricher
{
    /// <summary>
    /// بیمار «سابقه» دارد اگر علاوه بر نوبت فعلی، حداقل یک ویزیت دیگر داشته باشد.
    /// </summary>
    public static async Task EnrichPatientVisitHistoryFlagsAsync(
        IApplicationDbContext db,
        IList<AppointmentSummaryResult> items,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0) return;

        var patientIds = items.Select(i => i.PatientId).Distinct().ToList();

        var appointmentCounts = await db.Appointments
            .AsNoTracking()
            .Where(a => patientIds.Contains(a.PatientId))
            .GroupBy(a => a.PatientId)
            .Select(g => new { PatientId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PatientId, x => x.Count, cancellationToken);

        foreach (var item in items)
        {
            item.PatientHasVisitHistory = appointmentCounts.TryGetValue(item.PatientId, out var count) && count > 1;
        }
    }
}
