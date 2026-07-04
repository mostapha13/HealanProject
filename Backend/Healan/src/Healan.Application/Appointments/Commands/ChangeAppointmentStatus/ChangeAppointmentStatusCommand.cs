using Healan.Application.Common.Interfaces;
using Healan.Domain.Appointments.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Appointments.Commands.ChangeAppointmentStatus;

public class ChangeAppointmentStatusCommand : IRequest<ChangeAppointmentStatusResult>
{
    public long AppointmentId { get; set; }
    public AppointmentTypeId AppointmentTypeId { get; set; }
}

public record ChangeAppointmentStatusResult(long AppointmentId, AppointmentTypeId Status);

public class ChangeAppointmentStatusCommandHandler
    : IRequestHandler<ChangeAppointmentStatusCommand, ChangeAppointmentStatusResult>
{
    private readonly IApplicationDbContext _db;

    public ChangeAppointmentStatusCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<ChangeAppointmentStatusResult> Handle(
        ChangeAppointmentStatusCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(x => x.AppointmentId == request.AppointmentId, cancellationToken);

        if (appointment is null)
            throw new NotFoundExceptions("نوبت یافت نشد");

        appointment.AppointmentTypeId = request.AppointmentTypeId;
        await _db.SaveChangesAsync(cancellationToken);
        return new ChangeAppointmentStatusResult(appointment.AppointmentId, appointment.AppointmentTypeId);
    }
}
