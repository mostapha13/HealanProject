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
    public long? BookingDepartmentId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public string StartTime { get; set; } = "17:00";
    public string EndTime { get; set; } = "21:00";
    public int VisitDurationMinutes { get; set; } = 30;
    public int? ComplementaryInsuranceLimit { get; set; }
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

        BookingDepartment? department = null;
        if (request.BookingDepartmentId is > 0)
        {
            department = await _db.BookingDepartments.AsNoTracking().FirstOrDefaultAsync(x => x.BookingDepartmentId == request.BookingDepartmentId && x.IsActive, cancellationToken)
                ?? throw new NotFoundExceptions("دپارتمان فعال یافت نشد.");
            if (department.MedicalGroupTypeId != doctor.MedicalGroupTypeId)
                throw new BadRequestExceptions("دپارتمان انتخاب‌شده متعلق به تخصص این پزشک نیست.");
            if (!department.SupportsComplementaryInsurance && request.ComplementaryInsuranceLimit is > 0)
                throw new BadRequestExceptions("این دپارتمان امکان پذیرش بیمه تکمیلی ندارد.");
        }
        if (request.ComplementaryInsuranceLimit < 0)
            throw new BadRequestExceptions("سقف بیمه تکمیلی نمی‌تواند منفی باشد.");
        var overlaps = await _db.DoctorScheduleTemplates.AsNoTracking().AnyAsync(x =>
            x.DoctorId == request.DoctorId && x.DayOfWeek == request.DayOfWeek && x.IsActive
            && x.DoctorScheduleTemplateId != request.DoctorScheduleTemplateId
            && x.StartTime < end && start < x.EndTime, cancellationToken);
        if (overlaps)
            throw new BadRequestExceptions("این بازه با یکی از برنامه‌های همان پزشک هم‌پوشانی دارد.");

        DoctorScheduleTemplate entity;
        if (request.DoctorScheduleTemplateId > 0)
        {
            entity = await _db.DoctorScheduleTemplates
                .FirstOrDefaultAsync(x => x.DoctorScheduleTemplateId == request.DoctorScheduleTemplateId, cancellationToken)
                ?? throw new NotFoundExceptions("قالب برنامه یافت نشد.");
        }
        else
        {
            entity = new DoctorScheduleTemplate { DoctorId = request.DoctorId, DayOfWeek = request.DayOfWeek, CreatedAt = DateTime.UtcNow };

            if (entity.DoctorScheduleTemplateId == 0)
                _db.DoctorScheduleTemplates.Add(entity);
        }

        entity.DoctorId = request.DoctorId;
        entity.DayOfWeek = request.DayOfWeek;
        entity.BookingDepartmentId = request.BookingDepartmentId is > 0 ? request.BookingDepartmentId : null;
        entity.StartTime = start;
        entity.EndTime = end;
        entity.VisitDurationMinutes = request.VisitDurationMinutes;
        entity.ComplementaryInsuranceLimit = department?.SupportsComplementaryInsurance == true ? request.ComplementaryInsuranceLimit : 0;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new ScheduleTemplateDto
        {
            DoctorScheduleTemplateId = entity.DoctorScheduleTemplateId,
            DoctorId = entity.DoctorId,
            DoctorName = $"{doctor.FirstName} {doctor.LastName}".Trim(),
            BookingDepartmentId = entity.BookingDepartmentId,
            BookingDepartmentTitle = department?.Title,
            DayOfWeek = (int)entity.DayOfWeek,
            StartTime = BookingTimeHelper.FormatTime(entity.StartTime),
            EndTime = BookingTimeHelper.FormatTime(entity.EndTime),
            VisitDurationMinutes = entity.VisitDurationMinutes,
            ComplementaryInsuranceLimit = entity.ComplementaryInsuranceLimit,
            IsActive = entity.IsActive,
        };
    }
}
