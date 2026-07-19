using Healan.Application.Booking.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Orders.Dtos;
using Healan.Application.Patients.Queries.PatientVisitHistory;
using Healan.Application.Portal.Services;
using Healan.Domain.Patients.Entities;
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

        var bookings = await _db.AppointmentBookings.AsNoTracking()
            .Where(x => x.PatientId == patientId
                        || x.PhoneNumber == phone)
            .OrderByDescending(x => x.Slot.StartAt)
            .Take(50)
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

        var appointments = await _db.Appointments
            .AsNoTracking()
            .Include(a => a.Doctor)
            .Include(a => a.Prescriptions)
                .ThenInclude(p => p.PrescriptionDrugs)
            .Where(a => a.PatientId == patientId && !a.IsDeleted)
            .OrderByDescending(a => a.AppointmentDate)
            .Take(40)
            .ToListAsync(cancellationToken);

        var visits = new List<PatientVisitHistoryItemResult>();
        foreach (var appointment in appointments)
        {
            var prescription = appointment.Prescriptions?
                .Where(p => !p.IsDeleted)
                .OrderByDescending(p => p.IssueDate)
                .FirstOrDefault();

            visits.Add(new PatientVisitHistoryItemResult
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
                HasEchoReport = false,
                Drugs = prescription?.PrescriptionDrugs?
                    .Select(d => new PrescriptionDrugDto
                    {
                        DrugName = d.DrugName,
                        Dosage = d.Dosage,
                        UsageInstructions = d.UsageInstructions,
                    })
                    .ToList() ?? new List<PrescriptionDrugDto>(),
            });
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

        return await _db.PatientBloodPressureLogs.AsNoTracking()
            .Where(x => x.PatientId == patientId && !x.IsDeleted)
            .OrderByDescending(x => x.MeasuredAt)
            .Take(100)
            .Select(x => new PortalBloodPressureDto
            {
                Id = x.PatientBloodPressureLogId,
                Systolic = x.Systolic,
                Diastolic = x.Diastolic,
                Pulse = x.Pulse,
                MeasuredAt = x.MeasuredAt,
                Note = x.Note,
            })
            .ToListAsync(cancellationToken);
    }
}

public class PortalBloodPressureSaveCommand : IRequest<PortalBloodPressureDto>
{
    public string? AccessToken { get; set; }
    public long? Id { get; set; }
    public int Systolic { get; set; }
    public int Diastolic { get; set; }
    public int? Pulse { get; set; }
    public DateTime? MeasuredAt { get; set; }
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
        entity.MeasuredAt = request.MeasuredAt ?? DateTime.Now;
        entity.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        await _db.SaveChangesAsync(cancellationToken);

        return new PortalBloodPressureDto
        {
            Id = entity.PatientBloodPressureLogId,
            Systolic = entity.Systolic,
            Diastolic = entity.Diastolic,
            Pulse = entity.Pulse,
            MeasuredAt = entity.MeasuredAt,
            Note = entity.Note,
        };
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

        return await _db.PatientMedicationReminders.AsNoTracking()
            .Where(x => x.PatientId == patientId && !x.IsDeleted)
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.MedicationName)
            .Select(x => new PortalMedicationDto
            {
                Id = x.PatientMedicationReminderId,
                MedicationName = x.MedicationName,
                Dose = x.Dose,
                TimesOfDay = x.TimesOfDay,
                IsActive = x.IsActive,
            })
            .ToListAsync(cancellationToken);
    }
}

public class PortalMedicationSaveCommand : IRequest<PortalMedicationDto>
{
    public string? AccessToken { get; set; }
    public long? Id { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string? Dose { get; set; }
    public string TimesOfDay { get; set; } = string.Empty;
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

        var times = NormalizeTimes(request.TimesOfDay);
        if (times.Count == 0)
            throw new BadRequestExceptions("حداقل یک ساعت مصرف وارد کنید (مثلاً 08:00).");

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
        entity.TimesOfDay = string.Join(",", times);
        entity.IsActive = request.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        return new PortalMedicationDto
        {
            Id = entity.PatientMedicationReminderId,
            MedicationName = entity.MedicationName,
            Dose = entity.Dose,
            TimesOfDay = entity.TimesOfDay,
            IsActive = entity.IsActive,
        };
    }

    private static List<string> NormalizeTimes(string? raw)
    {
        var parts = (raw ?? string.Empty)
            .Split(new[] { ',', ';', ' ', '،' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var result = new List<string>();
        foreach (var part in parts)
        {
            var ascii = RagQuotaHelper.ToAsciiDigits(part).Trim();
            if (!TimeSpan.TryParse(ascii, out var ts) && !TimeSpan.TryParseExact(ascii, @"hh\:mm", null, out ts))
                continue;
            result.Add($"{(int)ts.TotalHours:00}:{ts.Minutes:00}");
        }

        return result.Distinct().OrderBy(x => x).ToList();
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
