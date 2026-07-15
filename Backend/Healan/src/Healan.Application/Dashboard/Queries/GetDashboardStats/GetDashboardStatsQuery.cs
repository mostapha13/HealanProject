using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Appointments.Enums;
using Healan.Domain.Invoices.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Dashboard.Queries.GetDashboardStats;

public class GetDashboardStatsQuery : IRequest<DashboardStatsResult>
{
}

public class DashboardStatsResult
{
    public int TodayAppointments { get; set; }
    public int WaitingAppointments { get; set; }
    public int InProgressAppointments { get; set; }
    public int CompletedToday { get; set; }
    public int TotalPatients { get; set; }
    public int TotalDoctors { get; set; }
    public decimal TodayRevenue { get; set; }
    public int PendingPayments { get; set; }
    public int TodayPrescriptions { get; set; }
}

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IClinicAccessScopeService _clinicAccess;

    public GetDashboardStatsQueryHandler(IApplicationDbContext db, IClinicAccessScopeService clinicAccess)
    {
        _db = db;
        _clinicAccess = clinicAccess;
    }

    public async Task<DashboardStatsResult> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        var todayAppointments = await _db.Appointments
            .Include(a => a.Invoices)
            .Include(a => a.Doctor)
            .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow)
            .ApplyClinicScope(scope)
            .ToListAsync(cancellationToken);

        var paidQuery = _db.Invoices
            .Include(i => i.Appointment).ThenInclude(a => a.Doctor)
            .Where(i =>
                i.InvoiceStatusTypeId == InvoiceStatusTypeId.Paid &&
                i.Appointment.AppointmentDate >= today &&
                i.Appointment.AppointmentDate < tomorrow);

        if (scope.Mode == ClinicDataAccessMode.ByDoctor && scope.DoctorId.HasValue && scope.DoctorId.Value > 0)
            paidQuery = paidQuery.Where(i => i.Appointment.DoctorId == scope.DoctorId.Value);
        else if (scope.Mode == ClinicDataAccessMode.ByCompany && scope.CompanyId.HasValue && scope.CompanyId.Value > 0)
            paidQuery = paidQuery.Where(i => i.Appointment.Doctor.CompanyId == scope.CompanyId.Value);
        else if (scope.Mode == ClinicDataAccessMode.ByCompany)
            paidQuery = paidQuery.Where(i => i.Appointment.CreatedBy == scope.IdentityUserId);
        else if (scope.Mode == ClinicDataAccessMode.None)
            paidQuery = paidQuery.Where(_ => false);

        var paidInvoicesToday = await paidQuery.ToListAsync(cancellationToken);

        var prescriptionsQuery = _db.Prescriptions
            .Include(p => p.Appointment).ThenInclude(a => a.Doctor)
            .Where(p => p.IssueDate >= today && p.IssueDate < tomorrow)
            .ApplyClinicScope(scope);

        return new DashboardStatsResult
        {
            TodayAppointments = todayAppointments.Count,
            WaitingAppointments = todayAppointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.Scheduled),
            InProgressAppointments = todayAppointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.InProgress),
            CompletedToday = todayAppointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.Completed),
            TotalPatients = await _db.Patients.ApplyClinicScope(scope).CountAsync(cancellationToken),
            TotalDoctors = await _db.Doctors.ApplyClinicScope(scope).CountAsync(cancellationToken),
            TodayRevenue = paidInvoicesToday.Sum(i => i.PatientPayable),
            PendingPayments = todayAppointments.Count(a =>
                a.Invoices.Any(i => i.InvoiceStatusTypeId == InvoiceStatusTypeId.Pending)),
            TodayPrescriptions = await prescriptionsQuery.CountAsync(cancellationToken),
        };
    }
}
