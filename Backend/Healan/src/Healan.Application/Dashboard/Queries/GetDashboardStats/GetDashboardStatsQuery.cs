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

    public GetDashboardStatsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<DashboardStatsResult> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        var todayAppointments = await _db.Appointments
            .Include(a => a.Invoices)
            .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow)
            .ToListAsync(cancellationToken);

        var paidInvoicesToday = await _db.Invoices
            .Include(i => i.Appointment)
            .Where(i =>
                i.InvoiceStatusTypeId == InvoiceStatusTypeId.Paid &&
                i.Appointment.AppointmentDate >= today &&
                i.Appointment.AppointmentDate < tomorrow)
            .ToListAsync(cancellationToken);

        return new DashboardStatsResult
        {
            TodayAppointments = todayAppointments.Count,
            WaitingAppointments = todayAppointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.Scheduled),
            InProgressAppointments = todayAppointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.InProgress),
            CompletedToday = todayAppointments.Count(a => a.AppointmentTypeId == AppointmentTypeId.Completed),
            TotalPatients = await _db.Patients.CountAsync(cancellationToken),
            TotalDoctors = await _db.Doctors.CountAsync(cancellationToken),
            TodayRevenue = paidInvoicesToday.Sum(i => i.PatientPayable),
            PendingPayments = todayAppointments.Count(a =>
                a.Invoices.Any(i => i.InvoiceStatusTypeId == InvoiceStatusTypeId.Pending)),
            TodayPrescriptions = await _db.Prescriptions
                .CountAsync(p => p.IssueDate >= today && p.IssueDate < tomorrow, cancellationToken)
        };
    }
}
