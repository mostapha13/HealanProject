using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Appointments.Enums;
using Healan.Domain.Invoices.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Extensions;

namespace Healan.Application.Reports.Queries.GetClinicAnalytics;

public class GetClinicAnalyticsQuery : IRequest<ClinicAnalyticsResult>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public long? DoctorId { get; set; }
    public long? PatientId { get; set; }
    public long? ServiceTypeId { get; set; }
}

public class GetClinicAnalyticsQueryHandler : IRequestHandler<GetClinicAnalyticsQuery, ClinicAnalyticsResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IClinicAccessScopeService _clinicAccess;

    public GetClinicAnalyticsQueryHandler(IApplicationDbContext db, IClinicAccessScopeService clinicAccess)
    {
        _db = db;
        _clinicAccess = clinicAccess;
    }

    public async Task<ClinicAnalyticsResult> Handle(GetClinicAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);
        var start = (request.StartDate ?? DateTime.Today).Date;
        var end = (request.EndDate ?? start).Date;
        if (end < start)
            (start, end) = (end, start);

        var endExclusive = end.AddDays(1);

        var appointmentsQuery = _db.Appointments
            .AsNoTracking()
            .Include(a => a.Doctor)
            .Include(a => a.ServiceTypes)
            .Include(a => a.Invoices)
            .Where(a => a.AppointmentDate >= start && a.AppointmentDate < endExclusive)
            .ApplyClinicScope(scope);

        if (request.DoctorId is > 0)
            appointmentsQuery = appointmentsQuery.Where(a => a.DoctorId == request.DoctorId.Value);

        if (request.PatientId is > 0)
            appointmentsQuery = appointmentsQuery.Where(a => a.PatientId == request.PatientId.Value);

        if (request.ServiceTypeId is > 0)
            appointmentsQuery = appointmentsQuery.Where(a => a.ServiceTypes.Any(s => s.ServiceTypeId == request.ServiceTypeId.Value));

        var appointments = await appointmentsQuery.ToListAsync(cancellationToken);
        var appointmentIds = appointments.Select(a => a.AppointmentId).ToList();

        var paidInvoices = appointments
            .SelectMany(a => a.Invoices)
            .Where(i => i.InvoiceStatusTypeId == InvoiceStatusTypeId.Paid)
            .ToList();

        var pendingCount = appointments.Count(a =>
            a.Invoices.Any(i => i.InvoiceStatusTypeId == InvoiceStatusTypeId.Pending));

        var prescriptions = appointmentIds.Count == 0
            ? []
            : await _db.Prescriptions
                .AsNoTracking()
                .Where(p => appointmentIds.Contains(p.AppointmentId))
                .Where(p => p.IssueDate >= start && p.IssueDate < endExclusive)
                .ToListAsync(cancellationToken);

        var invoiceIds = paidInvoices.Select(i => i.InvoiceId).ToList();
        var payments = invoiceIds.Count == 0
            ? []
            : await _db.Payments
                .AsNoTracking()
                .Where(p => invoiceIds.Contains(p.InvoiceId))
                .ToListAsync(cancellationToken);

        var invoiceItems = invoiceIds.Count == 0
            ? []
            : await _db.InvoiceItems
                .AsNoTracking()
                .Include(ii => ii.ServiceType)
                .Where(ii => invoiceIds.Contains(ii.InvoiceId))
                .ToListAsync(cancellationToken);

        var summary = new ClinicAnalyticsSummaryResult
        {
            TotalAppointments = appointments.Count,
            CompletedAppointments = appointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.Completed),
            ScheduledAppointments = appointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.Scheduled),
            InProgressAppointments = appointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.InProgress),
            CancelledAppointments = appointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.Cancelled),
            NoShowAppointments = appointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.NoShow),
            TotalRevenue = paidInvoices.Sum(i => i.PatientPayable + i.PrimaryInsuranceCovered + i.SecondaryInsuranceCovered),
            PatientRevenue = paidInvoices.Sum(i => i.PatientPayable),
            InsuranceRevenue = paidInvoices.Sum(i => i.PrimaryInsuranceCovered + i.SecondaryInsuranceCovered),
            PendingPayments = pendingCount,
            PrescriptionCount = prescriptions.Count,
        };

        var appointmentsByStatus = appointments
            .GroupBy(a => a.AppointmentTypeId)
            .Select(g => new ClinicAnalyticsChartItemResult
            {
                Name = g.Key.GetDisplayName() ?? g.Key.ToString(),
                Count = g.Count(),
                Value = g.Count(),
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        var appointmentsOverTime = appointments
            .GroupBy(a => a.AppointmentDate.Date)
            .OrderBy(g => g.Key)
            .Select(g => new ClinicAnalyticsTimePointResult
            {
                Label = g.Key.ToString("yyyy-MM-dd"),
                Count = g.Count(),
                Value = g.Count(),
            })
            .ToList();

        var revenueOverTime = appointments
            .GroupBy(a => a.AppointmentDate.Date)
            .OrderBy(g => g.Key)
            .Select(g => new ClinicAnalyticsTimePointResult
            {
                Label = g.Key.ToString("yyyy-MM-dd"),
                Value = g.SelectMany(a => a.Invoices)
                    .Where(i => i.InvoiceStatusTypeId == InvoiceStatusTypeId.Paid)
                    .Sum(i => i.PatientPayable),
                Count = g.Count(),
            })
            .ToList();

        var revenueByPaymentMethod = payments
            .GroupBy(p => p.PaymentMethodTypeId)
            .Select(g => new ClinicAnalyticsChartItemResult
            {
                Name = g.Key.GetDisplayName() ?? g.Key.ToString(),
                Value = g.Sum(p => p.PatientShare),
                Count = g.Count(),
            })
            .OrderByDescending(x => x.Value)
            .ToList();

        var topServices = invoiceItems
            .GroupBy(ii => ii.ServiceType?.Title ?? $"خدمت {ii.ServiceTypeId}")
            .Select(g => new ClinicAnalyticsChartItemResult
            {
                Name = g.Key,
                Count = g.Sum(x => x.Quantity),
                Value = g.Sum(x => x.Amount),
            })
            .OrderByDescending(x => x.Value)
            .Take(8)
            .ToList();

        var topDoctors = appointments
            .GroupBy(a => a.Doctor == null ? "—" : $"{a.Doctor.FirstName} {a.Doctor.LastName}".Trim())
            .Select(g => new ClinicAnalyticsChartItemResult
            {
                Name = g.Key,
                Count = g.Count(),
                Value = g.SelectMany(a => a.Invoices)
                    .Where(i => i.InvoiceStatusTypeId == InvoiceStatusTypeId.Paid)
                    .Sum(i => i.PatientPayable),
            })
            .OrderByDescending(x => x.Count)
            .Take(8)
            .ToList();

        var prescriptionsOverTime = prescriptions
            .GroupBy(p => p.IssueDate.Date)
            .OrderBy(g => g.Key)
            .Select(g => new ClinicAnalyticsTimePointResult
            {
                Label = g.Key.ToString("yyyy-MM-dd"),
                Count = g.Count(),
                Value = g.Count(),
            })
            .ToList();

        var allInvoices = appointments.SelectMany(a => a.Invoices).ToList();
        var paymentStatusBreakdown = allInvoices
            .GroupBy(i => i.InvoiceStatusTypeId)
            .Select(g => new ClinicAnalyticsChartItemResult
            {
                Name = g.Key.GetDisplayName() ?? g.Key.ToString(),
                Count = g.Count(),
                Value = g.Sum(i => i.PatientPayable),
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        return new ClinicAnalyticsResult
        {
            StartDate = start.ToString("yyyy-MM-dd"),
            EndDate = end.ToString("yyyy-MM-dd"),
            Summary = summary,
            AppointmentsByStatus = appointmentsByStatus,
            AppointmentsOverTime = appointmentsOverTime,
            RevenueOverTime = revenueOverTime,
            RevenueByPaymentMethod = revenueByPaymentMethod,
            TopServices = topServices,
            TopDoctors = topDoctors,
            PrescriptionsOverTime = prescriptionsOverTime,
            PaymentStatusBreakdown = paymentStatusBreakdown,
        };
    }
}
