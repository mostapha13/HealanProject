using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Booking.Commands.ScheduleTemplateDelete;

public class ScheduleTemplateDeleteCommand : IRequest<object>
{
    public long DoctorScheduleTemplateId { get; set; }
}

public class ScheduleTemplateDeleteCommandHandler : IRequestHandler<ScheduleTemplateDeleteCommand, object>
{
    private readonly IApplicationDbContext _db;
    public ScheduleTemplateDeleteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<object> Handle(ScheduleTemplateDeleteCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.DoctorScheduleTemplates
            .FirstOrDefaultAsync(x => x.DoctorScheduleTemplateId == request.DoctorScheduleTemplateId, cancellationToken)
            ?? throw new NotFoundExceptions("قالب برنامه یافت نشد.");
        _db.DoctorScheduleTemplates.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return new { deleted = true };
    }
}
