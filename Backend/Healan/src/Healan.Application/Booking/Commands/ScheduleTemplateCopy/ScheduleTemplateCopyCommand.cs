using Healan.Application.Booking.Commands.ScheduleTemplateSave;
using Healan.Application.Booking.Dtos;
using Healan.Application.Booking.Services;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Booking.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Booking.Commands.ScheduleTemplateCopy;

public class ScheduleTemplateCopyCommand : IRequest<object>
{
    public long DoctorId { get; set; }
    public DayOfWeek SourceDayOfWeek { get; set; }
    public List<DayOfWeek> TargetDayOfWeeks { get; set; } = new();
}

public class ScheduleTemplateCopyCommandHandler : IRequestHandler<ScheduleTemplateCopyCommand, object>
{
    private readonly IApplicationDbContext _db;
    public ScheduleTemplateCopyCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<object> Handle(ScheduleTemplateCopyCommand request, CancellationToken cancellationToken)
    {
        var source = await _db.DoctorScheduleTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.DoctorId == request.DoctorId && x.DayOfWeek == request.SourceDayOfWeek, cancellationToken)
            ?? throw new NotFoundExceptions("قالب مبدأ یافت نشد.");

        var targets = request.TargetDayOfWeeks
            .Where(d => d != request.SourceDayOfWeek)
            .Distinct()
            .ToList();
        if (targets.Count == 0)
            throw new BadRequestExceptions("روز مقصد انتخاب نشده است.");

        var copied = 0;
        foreach (var day in targets)
        {
            var existing = await _db.DoctorScheduleTemplates
                .FirstOrDefaultAsync(x => x.DoctorId == request.DoctorId && x.DayOfWeek == day, cancellationToken);
            if (existing is null)
            {
                existing = new DoctorScheduleTemplate
                {
                    DoctorId = request.DoctorId,
                    DayOfWeek = day,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.DoctorScheduleTemplates.Add(existing);
            }

            existing.StartTime = source.StartTime;
            existing.EndTime = source.EndTime;
            existing.VisitDurationMinutes = source.VisitDurationMinutes;
            existing.IsActive = source.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;
            copied++;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new { copied };
    }
}

public class ScheduleGenerateSlotsCommand : IRequest<object>
{
    public long DoctorId { get; set; }
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
}

public class ScheduleGenerateSlotsCommandHandler : IRequestHandler<ScheduleGenerateSlotsCommand, object>
{
    private readonly IApplicationDbContext _db;
    public ScheduleGenerateSlotsCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<object> Handle(ScheduleGenerateSlotsCommand request, CancellationToken cancellationToken)
    {
        if (!BookingTimeHelper.TryParseDate(request.FromDate, out var from)
            || !BookingTimeHelper.TryParseDate(request.ToDate, out var to))
            throw new BadRequestExceptions("بازه تاریخ نامعتبر است.");

        if (!await _db.Doctors.AnyAsync(x => x.DoctorId == request.DoctorId, cancellationToken))
            throw new NotFoundExceptions("پزشک یافت نشد.");

        var added = await AppointmentSlotGenerator.GenerateAsync(_db, request.DoctorId, from, to, cancellationToken);
        return new { added };
    }
}

public class ScheduleExceptionSaveCommand : IRequest<ScheduleExceptionDto>
{
    public long DoctorScheduleExceptionId { get; set; }
    public long DoctorId { get; set; }
    public string Date { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public int? VisitDurationMinutes { get; set; }
    public string? Note { get; set; }
}

public class ScheduleExceptionSaveCommandHandler : IRequestHandler<ScheduleExceptionSaveCommand, ScheduleExceptionDto>
{
    private readonly IApplicationDbContext _db;
    public ScheduleExceptionSaveCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<ScheduleExceptionDto> Handle(ScheduleExceptionSaveCommand request, CancellationToken cancellationToken)
    {
        if (!BookingTimeHelper.TryParseDate(request.Date, out var date))
            throw new BadRequestExceptions("تاریخ نامعتبر است.");

        DoctorScheduleException entity;
        if (request.DoctorScheduleExceptionId > 0)
        {
            entity = await _db.DoctorScheduleExceptions
                .FirstOrDefaultAsync(x => x.DoctorScheduleExceptionId == request.DoctorScheduleExceptionId, cancellationToken)
                ?? throw new NotFoundExceptions("استثنا یافت نشد.");
        }
        else
        {
            entity = await _db.DoctorScheduleExceptions
                .FirstOrDefaultAsync(x => x.DoctorId == request.DoctorId && x.Date == date, cancellationToken)
                ?? new DoctorScheduleException { DoctorId = request.DoctorId, Date = date, CreatedAt = DateTime.UtcNow };
            if (entity.DoctorScheduleExceptionId == 0)
                _db.DoctorScheduleExceptions.Add(entity);
        }

        entity.IsClosed = request.IsClosed;
        entity.StartTime = string.IsNullOrWhiteSpace(request.StartTime) ? null : BookingTimeHelper.ParseTime(request.StartTime);
        entity.EndTime = string.IsNullOrWhiteSpace(request.EndTime) ? null : BookingTimeHelper.ParseTime(request.EndTime);
        entity.VisitDurationMinutes = request.VisitDurationMinutes;
        entity.Note = request.Note;
        entity.Date = date;
        entity.DoctorId = request.DoctorId;

        await _db.SaveChangesAsync(cancellationToken);

        return new ScheduleExceptionDto
        {
            DoctorScheduleExceptionId = entity.DoctorScheduleExceptionId,
            DoctorId = entity.DoctorId,
            Date = entity.Date.ToString("yyyy-MM-dd"),
            IsClosed = entity.IsClosed,
            StartTime = entity.StartTime is null ? null : BookingTimeHelper.FormatTime(entity.StartTime.Value),
            EndTime = entity.EndTime is null ? null : BookingTimeHelper.FormatTime(entity.EndTime.Value),
            VisitDurationMinutes = entity.VisitDurationMinutes,
            Note = entity.Note,
        };
    }
}
