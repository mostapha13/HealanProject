using Healan.Application.Booking.Dtos;
using Healan.Application.Booking.Services;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Booking.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Booking.Commands.ScheduleTemplateSave;

public class ScheduleTemplateSaveCommand : IRequest<ScheduleTemplateDto>
{
    public long DoctorScheduleTemplateId { get; set; }
    public long DoctorId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public string StartTime { get; set; } = "17:00";
    public string EndTime { get; set; } = "21:00";
    public int VisitDurationMinutes { get; set; } = 30;
    public bool IsActive { get; set; } = true;
}

public class ScheduleTemplateSaveCommandHandler : IRequestHandler<ScheduleTemplateSaveCommand, ScheduleTemplateDto>
{
    private readonly IApplicationDbContext _db;

    public ScheduleTemplateSaveCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<ScheduleTemplateDto> Handle(ScheduleTemplateSaveCommand request, CancellationToken cancellationToken)
    {
        if (request.DoctorId <= 0)
            throw new BadRequestExceptions("پزشک الزامی است.");
        if (request.VisitDurationMinutes <= 0)
            throw new BadRequestExceptions("مدت ویزیت باید مثبت باشد.");

        var start = BookingTimeHelper.ParseTime(request.StartTime);
        var end = BookingTimeHelper.ParseTime(request.EndTime);
        if (end < start)
            throw new BadRequestExceptions("ساعت پایان نباید قبل از شروع باشد.");

        var doctor = await _db.Doctors.AsNoTracking()
            .FirstOrDefaultAsync(x => x.DoctorId == request.DoctorId, cancellationToken)
            ?? throw new NotFoundExceptions("پزشک یافت نشد.");

        DoctorScheduleTemplate entity;
        if (request.DoctorScheduleTemplateId > 0)
        {
            entity = await _db.DoctorScheduleTemplates
                .FirstOrDefaultAsync(x => x.DoctorScheduleTemplateId == request.DoctorScheduleTemplateId, cancellationToken)
                ?? throw new NotFoundExceptions("قالب برنامه یافت نشد.");
        }
        else
        {
            entity = await _db.DoctorScheduleTemplates
                .FirstOrDefaultAsync(x => x.DoctorId == request.DoctorId && x.DayOfWeek == request.DayOfWeek, cancellationToken)
                ?? new DoctorScheduleTemplate { DoctorId = request.DoctorId, DayOfWeek = request.DayOfWeek, CreatedAt = DateTime.UtcNow };

            if (entity.DoctorScheduleTemplateId == 0)
                _db.DoctorScheduleTemplates.Add(entity);
        }

        entity.DoctorId = request.DoctorId;
        entity.DayOfWeek = request.DayOfWeek;
        entity.StartTime = start;
        entity.EndTime = end;
        entity.VisitDurationMinutes = request.VisitDurationMinutes;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new ScheduleTemplateDto
        {
            DoctorScheduleTemplateId = entity.DoctorScheduleTemplateId,
            DoctorId = entity.DoctorId,
            DoctorName = $"{doctor.FirstName} {doctor.LastName}".Trim(),
            DayOfWeek = entity.DayOfWeek,
            StartTime = BookingTimeHelper.FormatTime(entity.StartTime),
            EndTime = BookingTimeHelper.FormatTime(entity.EndTime),
            VisitDurationMinutes = entity.VisitDurationMinutes,
            IsActive = entity.IsActive,
        };
    }
}
