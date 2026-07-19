using Healan.Application.Booking.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Orders.Dtos;
using Healan.Application.Patients.Queries.PatientVisitHistory;
using Healan.Application.Portal.Services;
using Healan.Domain.Booking.Enums;
using Healan.Domain.Patients.Entities;
using Healan.Domain.Patients.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;

namespace Healan.Application.Portal.PatientArea;

public static class PortalPatientResolver
{
    public static async Task<(Guid UserId, string Phone, long PatientId)> RequirePatientAsync(
        IApplicationDbContext db,
        IPortalAuthTokenService tokenService,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken)
            || !tokenService.TryValidate(accessToken, out var userId, out var phoneRaw))
            throw new BadRequestExceptions("برای دسترسی به ناحیه بیمار وارد شوید.");

        var phone = RagQuotaHelper.NormalizePhone(phoneRaw);
        if (phone.Length != 11)
            throw new BadRequestExceptions("شماره موبایل نامعتبر است.");

        var patientId = await db.Patients.AsNoTracking()
            .Where(x => !x.IsDeleted && (x.PhoneNumber == phone || x.User.IdentityUserId == userId))
            .OrderByDescending(x => x.PatientId)
            .Select(x => (long?)x.PatientId)
            .FirstOrDefaultAsync(cancellationToken);

        if (patientId is null or <= 0)
            throw new BadRequestExceptions("پروفایل بیمار کامل نیست. ابتدا مشخصات را تکمیل کنید.");

        return (userId, phone, patientId.Value);
    }
}

public static class MedicationScheduleCalculator
{
    private static readonly int[] AllowedIntervals = { 4, 6, 8, 10, 12, 24 };

    public static List<string> Calculate(TimeSpan firstDose, int intervalHours)
    {
        if (!AllowedIntervals.Contains(intervalHours))
            throw new BadRequestExceptions("فاصله مصرف باید یکی از ۴، ۶، ۸، ۱۰، ۱۲ یا ۲۴ ساعت باشد.");

        var start = DateTime.Today.Add(firstDose);
        var end = start.AddHours(24);
        var labels = new List<string>();
        for (var t = start; t < end; t = t.AddHours(intervalHours))
        {
            var timePart = t.ToString("HH:mm");
            labels.Add(t.Date > start.Date ? $"{timePart}+1" : timePart);
        }

        if (labels.Count == 0)
            throw new BadRequestExceptions("امکان محاسبه ساعات مصرف وجود ندارد.");

        return labels;
    }
}

public class PortalMyHistoryQuery : IRequest<PortalMyHistoryResult>
{
    public string? AccessToken { get; set; }
}

public class PortalMyHistoryResult
{
    public List<AppointmentBookingDto> Bookings { get; set; } = new();
    public List<PatientVisitHistoryItemResult> Visits { get; set; } = new();
}

public class PortalMyHistoryQueryHandler : IRequestHandler<PortalMyHistoryQuery, PortalMyHistoryResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPortalAuthTokenService _tokenService;

    public PortalMyHistoryQueryHandler(IApplicationDbContext db, IPortalAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<PortalMyHistoryResult> Handle(PortalMyHistoryQuery request, CancellationToken cancellationToken)
    {
        var (_, phone, patientId) = await PortalPatientResolver.RequirePatientAsync(
            _db, _tokenService, request.AccessToken, cancellationToken);

        var now = DateTime.Now;
        var bookingsRaw = await _db.AppointmentBookings.AsNoTracking()
            .Where(x => x.PatientId == patientId || x.PhoneNumber == phone)
            .Select(x => new AppointmentBookingDto
            {
                AppointmentBookingId = x.AppointmentBookingId,
                AppointmentSlotId = x.AppointmentSlotId,
                DoctorId = x.DoctorId,
                DoctorName = (x.Doctor.FirstName + " " + x.Doctor.LastName).Trim(),
                PatientId = x.PatientId,
                NationalCode = x.NationalCode,
                PhoneNumber = x.PhoneNumber,
                FirstName = x.FirstName,
                LastName = x.LastName,
                Note = x.Note,
                Status = (byte)x.Status,
                AppointmentId = x.AppointmentId,
                BookedByStaff = x.BookedByStaff,
                CreatedAt = x.CreatedAt,
                StartAt = x.Slot.StartAt,
                EndAt = x.Slot.EndAt,
            })
            .ToListAsync(cancellationToken);

        var bookings = bookingsRaw
            .OrderBy(x => x.StartAt < now ? 1 : 0)
            .ThenBy(x => x.StartAt < now
                ? DateTime.MaxValue.Ticks - x.StartAt.Ticks
                : x.StartAt.Ticks)
            .Take(100)
            .ToList();

        foreach (var b in bookings)
            b.StatusTitle = AppointmentBookingStatusTitles.ToPersian(b.Status);

        var appointments = await _db.Appointments
            .AsNoTracking()
            .Include(a => a.Doctor)
            .Include(a => a.Prescriptions)
                .ThenInclude(p => p.PrescriptionDrugs)
            .Include(a => a.Prescriptions)
                .ThenInclude(p => p.LabTestRequests)
                    .ThenInclude(l => l.Attachment)
            .Include(a => a.Prescriptions)
                .ThenInclude(p => p.ImagingRequests)
                    .ThenInclude(i => i.Attachment)
            .Include(a => a.Prescriptions)
                .ThenInclude(p => p.EchoReport)
            .Where(a => a.PatientId == patientId && !a.IsDeleted)
            .OrderByDescending(a => a.AppointmentDate)
            .Take(80)
            .ToListAsync(cancellationToken);

        var visits = new List<PatientVisitHistoryItemResult>();
        foreach (var appointment in appointments)
        {
            var prescription = appointment.Prescriptions?
                .Where(p => !p.IsDeleted)
                .OrderByDescending(p => p.IssueDate)
                .FirstOrDefault();

            var item = new PatientVisitHistoryItemResult
            {
                AppointmentId = appointment.AppointmentId,
                AppointmentDate = appointment.AppointmentDate,
                AppointmentStatus = appointment.AppointmentTypeId.GetDisplayName()
                    ?? appointment.AppointmentTypeId.ToString(),
                DoctorName = appointment.Doctor == null
                    ? null
                    : $"{appointment.Doctor.FirstName} {appointment.Doctor.LastName}".Trim(),
                PrescriptionId = prescription?.PrescriptionId,
                PrescriptionIssueDate = prescription?.IssueDate,
                PrescriptionNotes = prescription?.Notes,
                HasEchoReport = prescription?.EchoReport != null,
                EchoConclusion = prescription?.EchoReport?.Conclusion,
                EchoRecommendation = prescription?.EchoReport?.Recommendation,
            };

            if (prescription != null)
            {
                item.Drugs = prescription.PrescriptionDrugs
                    .Select(d => new PrescriptionDrugDto
                    {
                        DrugName = d.DrugName,
                        Dosage = d.Dosage,
                        UsageInstructions = d.UsageInstructions,
                    })
                    .ToList();

                item.Labs = prescription.LabTestRequests
                    .Where(l => !l.IsDeleted)
                    .Select(l => new VisitLabItemResult
                    {
                        LabTestType = l.LabTestType,
                        Notes = l.Notes,
                        AttachmentId = l.AttachmentId,
                        AttachmentLink = l.Attachment?.Link,
                        AttachmentFileName = l.Attachment?.FileName,
                    })
                    .ToList();

                item.Imaging = prescription.ImagingRequests
                    .Where(i => !i.IsDeleted)
                    .Select(i => new VisitImagingItemResult
                    {
                        ImageTypeId = (byte)i.ImageTypeId,
                        ImageTypeName = i.ImageTypeId.GetDisplayName() ?? i.ImageTypeId.ToString(),
                        Notes = i.Notes,
                        AttachmentId = i.AttachmentId,
                        AttachmentLink = i.Attachment?.Link,
                        AttachmentFileName = i.Attachment?.FileName,
                    })
                    .ToList();
            }

            visits.Add(item);
        }

        return new PortalMyHistoryResult { Bookings = bookings, Visits = visits };
    }
}

public class PortalBloodPressureListQuery : IRequest<List<PortalBloodPressureDto>>
{
    public string? AccessToken { get; set; }
}

public class PortalBloodPressureDto
{
    public long Id { get; set; }
    public int Systolic { get; set; }
    public int Diastolic { get; set; }
    public int? Pulse { get; set; }
    public DateTime MeasuredAt { get; set; }
    public byte? PeriodOfDay { get; set; }
    public string? PeriodTitle { get; set; }
    public string? MeasuredTime { get; set; }
    public string? Note { get; set; }
}

public class PortalBloodPressureListQueryHandler
    : IRequestHandler<PortalBloodPressureListQuery, List<PortalBloodPressureDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly IPortalAuthTokenService _tokenService;

    public PortalBloodPressureListQueryHandler(IApplicationDbContext db, IPortalAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<List<PortalBloodPressureDto>> Handle(
        PortalBloodPressureListQuery request,
        CancellationToken cancellationToken)
    {
        var (_, _, patientId) = await PortalPatientResolver.RequirePatientAsync(
            _db, _tokenService, request.AccessToken, cancellationToken);

        var rows = await _db.PatientBloodPressureLogs.AsNoTracking()
            .Where(x => x.PatientId == patientId && !x.IsDeleted)
            .OrderByDescending(x => x.MeasuredAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return rows.Select(MapBp).ToList();
    }

    internal static PortalBloodPressureDto MapBp(PatientBloodPressureLog x) => new()
    {
        Id = x.PatientBloodPressureLogId,
        Systolic = x.Systolic,
        Diastolic = x.Diastolic,
        Pulse = x.Pulse,
        MeasuredAt = x.MeasuredAt,
        PeriodOfDay = x.PeriodOfDay.HasValue ? (byte)x.PeriodOfDay.Value : null,
        PeriodTitle = PeriodTitle(x.PeriodOfDay),
        MeasuredTime = x.MeasuredTime.HasValue
            ? $"{(int)x.MeasuredTime.Value.TotalHours:00}:{x.MeasuredTime.Value.Minutes:00}"
            : null,
        Note = x.Note,
    };

    internal static string? PeriodTitle(BloodPressurePeriod? period) => period switch
    {
        BloodPressurePeriod.Morning => "صبح",
        BloodPressurePeriod.Noon => "ظهر",
        BloodPressurePeriod.Night => "شب",
        _ => null,
    };
}

public class PortalBloodPressureSaveCommand : IRequest<PortalBloodPressureDto>
{
    public string? AccessToken { get; set; }
    public long? Id { get; set; }
    public int Systolic { get; set; }
    public int Diastolic { get; set; }
    public int? Pulse { get; set; }
    public DateTime? MeasuredAt { get; set; }
    public byte? PeriodOfDay { get; set; }
    public string? MeasuredTime { get; set; }
    public string? Note { get; set; }
}

public class PortalBloodPressureSaveCommandHandler
    : IRequestHandler<PortalBloodPressureSaveCommand, PortalBloodPressureDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IPortalAuthTokenService _tokenService;

    public PortalBloodPressureSaveCommandHandler(IApplicationDbContext db, IPortalAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<PortalBloodPressureDto> Handle(
        PortalBloodPressureSaveCommand request,
        CancellationToken cancellationToken)
    {
        var (_, _, patientId) = await PortalPatientResolver.RequirePatientAsync(
            _db, _tokenService, request.AccessToken, cancellationToken);

        if (request.Systolic < 60 || request.Systolic > 250
            || request.Diastolic < 30 || request.Diastolic > 150)
            throw new BadRequestExceptions("مقادیر فشار خون نامعتبر است.");

        if (request.Pulse is < 30 or > 220)
            throw new BadRequestExceptions("نبض نامعتبر است.");

        BloodPressurePeriod? period = null;
        if (request.PeriodOfDay is byte p)
        {
            if (!Enum.IsDefined(typeof(BloodPressurePeriod), p))
                throw new BadRequestExceptions("بازه زمانی نامعتبر است.");
            period = (BloodPressurePeriod)p;
        }

        TimeSpan? measuredTime = null;
        if (!string.IsNullOrWhiteSpace(request.MeasuredTime))
        {
            var ascii = RagQuotaHelper.ToAsciiDigits(request.MeasuredTime).Trim();
            if (!TimeSpan.TryParse(ascii, out var ts)
                && !TimeSpan.TryParseExact(ascii, @"hh\:mm", null, out ts))
                throw new BadRequestExceptions("ساعت اندازه‌گیری نامعتبر است.");
            measuredTime = new TimeSpan(ts.Hours, ts.Minutes, 0);
        }

        var date = (request.MeasuredAt ?? DateTime.Today).Date;
        var measuredAt = measuredTime.HasValue ? date.Add(measuredTime.Value) : date;

        PatientBloodPressureLog entity;
        if (request.Id is > 0)
        {
            entity = await _db.PatientBloodPressureLogs
                .FirstOrDefaultAsync(x => x.PatientBloodPressureLogId == request.Id
                                          && x.PatientId == patientId
                                          && !x.IsDeleted, cancellationToken)
                ?? throw new NotFoundExceptions("رکورد فشار خون یافت نشد.");
        }
        else
        {
            entity = new PatientBloodPressureLog { PatientId = patientId };
            _db.PatientBloodPressureLogs.Add(entity);
        }

        entity.Systolic = request.Systolic;
        entity.Diastolic = request.Diastolic;
        entity.Pulse = request.Pulse;
        entity.MeasuredAt = measuredAt;
        entity.PeriodOfDay = period;
        entity.MeasuredTime = measuredTime;
        entity.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        await _db.SaveChangesAsync(cancellationToken);
        return PortalBloodPressureListQueryHandler.MapBp(entity);
    }
}

public class PortalBloodPressureDeleteCommand : IRequest<object>
{
    public string? AccessToken { get; set; }
    public long Id { get; set; }
}

public class PortalBloodPressureDeleteCommandHandler
    : IRequestHandler<PortalBloodPressureDeleteCommand, object>
{
    private readonly IApplicationDbContext _db;
    private readonly IPortalAuthTokenService _tokenService;

    public PortalBloodPressureDeleteCommandHandler(IApplicationDbContext db, IPortalAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<object> Handle(PortalBloodPressureDeleteCommand request, CancellationToken cancellationToken)
    {
        var (_, _, patientId) = await PortalPatientResolver.RequirePatientAsync(
            _db, _tokenService, request.AccessToken, cancellationToken);

        var entity = await _db.PatientBloodPressureLogs
            .FirstOrDefaultAsync(x => x.PatientBloodPressureLogId == request.Id
                                      && x.PatientId == patientId
                                      && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundExceptions("رکورد فشار خون یافت نشد.");

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return new { deleted = true };
    }
}

public class PortalMedicationListQuery : IRequest<List<PortalMedicationDto>>
{
    public string? AccessToken { get; set; }
}

public class PortalMedicationDto
{
    public long Id { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string? Dose { get; set; }
    public int IntervalHours { get; set; }
    public string FirstDoseTime { get; set; } = string.Empty;
    public string TimesOfDay { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class PortalMedicationListQueryHandler
    : IRequestHandler<PortalMedicationListQuery, List<PortalMedicationDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly IPortalAuthTokenService _tokenService;

    public PortalMedicationListQueryHandler(IApplicationDbContext db, IPortalAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<List<PortalMedicationDto>> Handle(
        PortalMedicationListQuery request,
        CancellationToken cancellationToken)
    {
        var (_, _, patientId) = await PortalPatientResolver.RequirePatientAsync(
            _db, _tokenService, request.AccessToken, cancellationToken);

        var rows = await _db.PatientMedicationReminders.AsNoTracking()
            .Where(x => x.PatientId == patientId && !x.IsDeleted)
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.MedicationName)
            .Take(200)
            .ToListAsync(cancellationToken);

        return rows.Select(MapMed).ToList();
    }

    internal static PortalMedicationDto MapMed(PatientMedicationReminder x) => new()
    {
        Id = x.PatientMedicationReminderId,
        MedicationName = x.MedicationName,
        Dose = x.Dose,
        IntervalHours = x.IntervalHours,
        FirstDoseTime = $"{(int)x.FirstDoseTime.TotalHours:00}:{x.FirstDoseTime.Minutes:00}",
        TimesOfDay = x.TimesOfDay,
        IsActive = x.IsActive,
    };
}

public class PortalMedicationSaveCommand : IRequest<PortalMedicationDto>
{
    public string? AccessToken { get; set; }
    public long? Id { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string? Dose { get; set; }
    public int IntervalHours { get; set; } = 8;
    public string FirstDoseTime { get; set; } = "08:00";
    public bool IsActive { get; set; } = true;
}

public class PortalMedicationSaveCommandHandler
    : IRequestHandler<PortalMedicationSaveCommand, PortalMedicationDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IPortalAuthTokenService _tokenService;

    public PortalMedicationSaveCommandHandler(IApplicationDbContext db, IPortalAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<PortalMedicationDto> Handle(
        PortalMedicationSaveCommand request,
        CancellationToken cancellationToken)
    {
        var (_, _, patientId) = await PortalPatientResolver.RequirePatientAsync(
            _db, _tokenService, request.AccessToken, cancellationToken);

        var name = (request.MedicationName ?? string.Empty).Trim();
        if (name.Length < 2)
            throw new BadRequestExceptions("نام دارو را وارد کنید.");

        var ascii = RagQuotaHelper.ToAsciiDigits(request.FirstDoseTime).Trim();
        if (!TimeSpan.TryParse(ascii, out var first)
            && !TimeSpan.TryParseExact(ascii, @"hh\:mm", null, out first))
            throw new BadRequestExceptions("ساعت اولین مصرف نامعتبر است.");

        first = new TimeSpan(first.Hours, first.Minutes, 0);
        var times = MedicationScheduleCalculator.Calculate(first, request.IntervalHours);

        PatientMedicationReminder entity;
        if (request.Id is > 0)
        {
            entity = await _db.PatientMedicationReminders
                .FirstOrDefaultAsync(x => x.PatientMedicationReminderId == request.Id
                                          && x.PatientId == patientId
                                          && !x.IsDeleted, cancellationToken)
                ?? throw new NotFoundExceptions("یادآوری دارو یافت نشد.");
        }
        else
        {
            entity = new PatientMedicationReminder { PatientId = patientId };
            _db.PatientMedicationReminders.Add(entity);
        }

        entity.MedicationName = name;
        entity.Dose = string.IsNullOrWhiteSpace(request.Dose) ? null : request.Dose.Trim();
        entity.IntervalHours = request.IntervalHours;
        entity.FirstDoseTime = first;
        entity.TimesOfDay = string.Join(",", times);
        entity.IsActive = request.IsActive;

        await _db.SaveChangesAsync(cancellationToken);
        return PortalMedicationListQueryHandler.MapMed(entity);
    }
}

public class PortalMedicationDeleteCommand : IRequest<object>
{
    public string? AccessToken { get; set; }
    public long Id { get; set; }
}

public class PortalMedicationDeleteCommandHandler
    : IRequestHandler<PortalMedicationDeleteCommand, object>
{
    private readonly IApplicationDbContext _db;
    private readonly IPortalAuthTokenService _tokenService;

    public PortalMedicationDeleteCommandHandler(IApplicationDbContext db, IPortalAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<object> Handle(PortalMedicationDeleteCommand request, CancellationToken cancellationToken)
    {
        var (_, _, patientId) = await PortalPatientResolver.RequirePatientAsync(
            _db, _tokenService, request.AccessToken, cancellationToken);

        var entity = await _db.PatientMedicationReminders
            .FirstOrDefaultAsync(x => x.PatientMedicationReminderId == request.Id
                                      && x.PatientId == patientId
                                      && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundExceptions("یادآوری دارو یافت نشد.");

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return new { deleted = true };
    }
}
