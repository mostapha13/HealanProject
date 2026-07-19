using Healan.Application.Booking.Dtos;
using Healan.Application.Booking.Services;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Services;
using Healan.Domain.Booking.Enums;
using Healan.Domain.Doctors.Enums;
using Healan.Domain.Patients.Entities;
using IdentityServer.GrpcClient;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Share.Domain.Enums;
using Share.Domain.Exceptions;

namespace Healan.Application.Booking.Queries.PortalBooking;

public class PortalHeartDoctorsQuery : IRequest<List<PortalDoctorDto>>
{
}

public class PortalHeartDoctorsQueryHandler : IRequestHandler<PortalHeartDoctorsQuery, List<PortalDoctorDto>>
{
    private readonly IApplicationDbContext _db;
    public PortalHeartDoctorsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<PortalDoctorDto>> Handle(PortalHeartDoctorsQuery request, CancellationToken cancellationToken)
    {
        return await _db.Doctors.AsNoTracking()
            .Where(x => x.MedicalGroupTypeId == MedicalGroupTypeId.Heart)
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
            .Select(x => new PortalDoctorDto
            {
                DoctorId = x.DoctorId,
                FirstName = x.FirstName,
                LastName = x.LastName,
            })
            .ToListAsync(cancellationToken);
    }
}

public class PortalOpenSlotsQuery : IRequest<List<PortalOpenSlotDto>>
{
    public long? DoctorId { get; set; }
    public string? FromDate { get; set; }
    public string? ToDate { get; set; }
}

public class PortalBookingServicesQuery : IRequest<List<PortalBookingServiceDto>>
{
}

public class PortalBookingServiceDto
{
    public long ServiceTypeId { get; set; }
    public string Title { get; set; } = string.Empty;
}

public class PortalBookingServicesQueryHandler : IRequestHandler<PortalBookingServicesQuery, List<PortalBookingServiceDto>>
{
    private readonly IApplicationDbContext _db;
    public PortalBookingServicesQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<PortalBookingServiceDto>> Handle(PortalBookingServicesQuery request, CancellationToken cancellationToken)
    {
        return await _db.ServiceTypes.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Title)
            .Select(x => new PortalBookingServiceDto
            {
                ServiceTypeId = x.ServiceTypeId,
                Title = x.Title,
            })
            .ToListAsync(cancellationToken);
    }
}

public class PortalOpenSlotsQueryHandler : IRequestHandler<PortalOpenSlotsQuery, List<PortalOpenSlotDto>>
{
    private readonly IApplicationDbContext _db;
    public PortalOpenSlotsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<PortalOpenSlotDto>> Handle(PortalOpenSlotsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.Now;
        var q = _db.AppointmentSlots.AsNoTracking()
            .Where(x => x.Status == AppointmentSlotStatus.Open
                        && x.StartAt > now
                        && x.Doctor.MedicalGroupTypeId == MedicalGroupTypeId.Heart);

        if (request.DoctorId is > 0)
            q = q.Where(x => x.DoctorId == request.DoctorId);
        if (DateOnly.TryParse(request.FromDate, out var from))
            q = q.Where(x => x.StartAt >= from.ToDateTime(TimeOnly.MinValue));
        if (DateOnly.TryParse(request.ToDate, out var to))
            q = q.Where(x => x.StartAt < to.AddDays(1).ToDateTime(TimeOnly.MinValue));
        else
            q = q.Where(x => x.StartAt < now.Date.AddDays(21));

        return await q.OrderBy(x => x.StartAt).Take(120)
            .Select(x => new PortalOpenSlotDto
            {
                AppointmentSlotId = x.AppointmentSlotId,
                DoctorId = x.DoctorId,
                DoctorName = (x.Doctor.FirstName + " " + x.Doctor.LastName).Trim(),
                StartAt = x.StartAt,
                EndAt = x.EndAt,
            })
            .ToListAsync(cancellationToken);
    }
}

public class BookingLookupPatientQuery : IRequest<BookingLookupPatientDto>
{
    public string? NationalCode { get; set; }
    public string? PhoneNumber { get; set; }
}

public class BookingLookupPatientQueryHandler : IRequestHandler<BookingLookupPatientQuery, BookingLookupPatientDto>
{
    private readonly IApplicationDbContext _db;
    public BookingLookupPatientQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<BookingLookupPatientDto> Handle(BookingLookupPatientQuery request, CancellationToken cancellationToken)
    {
        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        var national = RagQuotaHelper.ToAsciiDigits(request.NationalCode);

        Domain.Patients.Entities.Patient? patient = null;
        if (phone.Length == 11 && phone.StartsWith("09", StringComparison.Ordinal))
        {
            patient = await _db.Patients.AsNoTracking()
                .Where(x => x.PhoneNumber == phone)
                .OrderByDescending(x => x.PatientId)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (patient is null && national.Length == 10)
        {
            patient = await _db.Patients.AsNoTracking()
                .FirstOrDefaultAsync(x => x.NationalCode == national, cancellationToken);
        }

        if (patient is null)
        {
            return new BookingLookupPatientDto
            {
                Found = false,
                PhoneNumber = phone.Length == 11 ? phone : null,
                NationalCode = national.Length == 10 ? national : string.Empty,
            };
        }

        return new BookingLookupPatientDto
        {
            Found = true,
            PatientId = patient.PatientId,
            NationalCode = patient.NationalCode,
            FirstName = patient.FirstName,
            LastName = patient.LastName,
            PhoneNumber = patient.PhoneNumber,
        };
    }
}

public class PortalMyBookingsQuery : IRequest<List<AppointmentBookingDto>>
{
    public string? AccessToken { get; set; }
    public string? PhoneNumber { get; set; }
    public string? NationalCode { get; set; }
}

public class PortalMyBookingsQueryHandler : IRequestHandler<PortalMyBookingsQuery, List<AppointmentBookingDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly IPortalAuthTokenService _tokenService;

    public PortalMyBookingsQueryHandler(IApplicationDbContext db, IPortalAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<List<AppointmentBookingDto>> Handle(PortalMyBookingsQuery request, CancellationToken cancellationToken)
    {
        string phone;
        if (!string.IsNullOrWhiteSpace(request.AccessToken)
            && _tokenService.TryValidate(request.AccessToken, out _, out var tokenPhone))
        {
            phone = RagQuotaHelper.NormalizePhone(tokenPhone);
        }
        else
        {
            phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        }

        if (phone.Length != 11)
            throw new BadRequestExceptions("شماره موبایل نامعتبر است.");

        var q = _db.AppointmentBookings.AsNoTracking()
            .Where(x => x.PhoneNumber == phone
                        && x.Status == AppointmentBookingStatus.Booked
                        && x.Slot.StartAt > DateTime.Now);

        var national = RagQuotaHelper.ToAsciiDigits(request.NationalCode);
        if (national.Length == 10)
            q = q.Where(x => x.NationalCode == national);

        var items = await q.OrderBy(x => x.Slot.StartAt)
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

        if (items.Count == 0)
            return items;

        var ids = items.Select(x => x.AppointmentBookingId).ToList();
        var services = await _db.AppointmentBookings.AsNoTracking()
            .Where(x => ids.Contains(x.AppointmentBookingId))
            .Select(x => new
            {
                x.AppointmentBookingId,
                Ids = x.RequestedServices.Select(s => s.ServiceTypeId).ToArray(),
                Titles = x.RequestedServices.Select(s => s.Title).ToArray(),
            })
            .ToListAsync(cancellationToken);

        var map = services.ToDictionary(x => x.AppointmentBookingId);
        foreach (var item in items)
        {
            if (!map.TryGetValue(item.AppointmentBookingId, out var svc))
                continue;
            item.RequestedServiceTypeIds = svc.Ids.ToList();
            item.RequestedServiceTitles = svc.Titles.ToList();
        }

        return items;
    }
}

public class BookingOtpRequestCommand : IRequest<object>
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class BookingOtpRequestCommandHandler : IRequestHandler<BookingOtpRequestCommand, object>
{
    private static readonly TimeSpan OtpTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);
    private readonly IBookingOtpStore _otpStore;
    private readonly IPortalSmsSender _smsSender;

    public BookingOtpRequestCommandHandler(IBookingOtpStore otpStore, IPortalSmsSender smsSender)
    {
        _otpStore = otpStore;
        _smsSender = smsSender;
    }

    public async Task<object> Handle(BookingOtpRequestCommand request, CancellationToken cancellationToken)
    {
        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        if (phone.Length != 11 || !phone.StartsWith("09", StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل معتبر نیست (مثال: 09123456789)");

        if (await _otpStore.IsInCooldownAsync(phone, cancellationToken))
            throw new BadRequestExceptions("لطفاً کمی صبر کنید و دوباره تلاش کنید.");

        var code = Random.Shared.Next(100000, 999999).ToString();

        // Persist OTP before SMS so verify never races a missing store entry.
        await _otpStore.SetAsync(phone, code, OtpTtl, cancellationToken);
        await _otpStore.SetCooldownAsync(phone, ResendCooldown, cancellationToken);

        var (ok, error) = await _smsSender.SendAsync(
            phone,
            $"کلینیک قلب دکتر معصومه شهرویی\nکد تأیید رزرو نوبت: {code}",
            cancellationToken);

        if (!ok)
        {
            await _otpStore.RemoveAsync(phone, cancellationToken);
            await _otpStore.ClearCooldownAsync(phone, cancellationToken);
            throw new BadRequestExceptions(error ?? "ارسال پیامک ناموفق بود.");
        }

        return new
        {
            sent = true,
            expiresInSeconds = (int)OtpTtl.TotalSeconds,
            phoneMasked = RagQuotaHelper.MaskPhone(phone),
        };
    }
}

public class BookingOtpVerifyCommand : IRequest<BookingOtpVerifyResultDto>
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class BookingOtpVerifyCommandHandler : IRequestHandler<BookingOtpVerifyCommand, BookingOtpVerifyResultDto>
{
    private const string DefaultPassword = "aA@123456";

    private readonly IBookingOtpStore _otpStore;
    private readonly IMediator _mediator;
    private readonly IIdentityTool _identityTool;
    private readonly IPortalAuthTokenService _tokenService;

    public BookingOtpVerifyCommandHandler(
        IBookingOtpStore otpStore,
        IMediator mediator,
        IIdentityTool identityTool,
        IPortalAuthTokenService tokenService)
    {
        _otpStore = otpStore;
        _mediator = mediator;
        _identityTool = identityTool;
        _tokenService = tokenService;
    }

    public async Task<BookingOtpVerifyResultDto> Handle(BookingOtpVerifyCommand request, CancellationToken cancellationToken)
    {
        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        var code = RagQuotaHelper.ToAsciiDigits(request.Code);

        if (phone.Length != 11 || !phone.StartsWith("09", StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل معتبر نیست.");
        if (code.Length < 4 || code.Length > 8)
            throw new BadRequestExceptions("کد تأیید نامعتبر است.");

        var stored = await _otpStore.TryGetAsync(phone, cancellationToken);
        var expected = RagQuotaHelper.ToAsciiDigits(stored.Code);
        if (!stored.Found || string.IsNullOrWhiteSpace(expected) || !string.Equals(expected, code, StringComparison.Ordinal))
            throw new BadRequestExceptions("کد تأیید نادرست یا منقضی شده است. دوباره درخواست کد دهید.");

        BookingLookupPatientDto patient;
        try
        {
            patient = await _mediator.Send(new BookingLookupPatientQuery { PhoneNumber = phone }, cancellationToken);
        }
        catch
        {
            patient = new BookingLookupPatientDto
            {
                Found = false,
                PhoneNumber = phone,
                NationalCode = string.Empty,
            };
        }

        var firstName = (patient.FirstName ?? string.Empty).Trim();
        var lastName = (patient.LastName ?? string.Empty).Trim();
        var national = RagQuotaHelper.ToAsciiDigits(patient.NationalCode);
        var isPatient = patient.Found
            && firstName.Length >= 2
            && lastName.Length >= 2
            && national.Length == 10;

        UserSummaryReply? saved;
        try
        {
            saved = await _identityTool.SaveUser(new SaveRequest
            {
                UserId = string.Empty,
                PhoneNumber = phone,
                FirstName = firstName,
                LastName = lastName,
                IsActive = true,
                Password = DefaultPassword,
                DepartmentId = (int)DepartmentId.Public,
                TwoFactorEnabled = false,
            });
        }
        catch (BadRequestExceptions)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new BadRequestExceptions("ارتباط با سرویس احراز هویت برقرار نشد. کمی بعد دوباره تلاش کنید.");
        }

        if (saved == null || string.IsNullOrWhiteSpace(saved.UserId)
            || !Guid.TryParse(saved.UserId, out var userId))
            throw new BadRequestExceptions("امکان ایجاد/یافتن کاربر فراهم نشد. دوباره تلاش کنید.");

        // کد را فقط بعد از موفقیت ساخت/یافتن کاربر باطل کن تا خطای identity کد را نسوزاند
        await _otpStore.RemoveAsync(phone, cancellationToken);

        var bookingToken = Guid.NewGuid().ToString("N");
        await _otpStore.SetSessionAsync(bookingToken, phone, TimeSpan.FromMinutes(30), cancellationToken);

        await PortalAspNetRoleHelper.EnsureAsync(_identityTool, userId, includePatient: isPatient);

        var accessToken = _tokenService.CreateToken(userId, phone, out var expiresAt);

        return new BookingOtpVerifyResultDto
        {
            Verified = true,
            BookingToken = bookingToken,
            AccessToken = accessToken,
            UserId = userId,
            ExpiresAtUtc = expiresAt,
            ExpiresInSeconds = 30 * 60,
            PhoneNumber = phone,
            PhoneMasked = RagQuotaHelper.MaskPhone(phone),
            IsPatient = isPatient,
            PatientId = patient.PatientId,
            FirstName = firstName,
            LastName = lastName,
            NationalCode = national,
            Patient = patient,
        };
    }

}

public class BookingOtpVerifyResultDto
{
    public bool Verified { get; set; }
    public string BookingToken { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public int ExpiresInSeconds { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string PhoneMasked { get; set; } = string.Empty;
    public bool IsPatient { get; set; }
    public long? PatientId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string NationalCode { get; set; } = string.Empty;
    public BookingLookupPatientDto? Patient { get; set; }
}

public static class BookingSessionGuard
{
    public static async Task EnsureAsync(IBookingOtpStore store, string? bookingToken, string phoneNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(bookingToken))
            throw new BadRequestExceptions("جلسه تأیید منقضی شده است. دوباره کد بگیرید.");

        var sessionPhone = await store.GetSessionPhoneAsync(bookingToken.Trim(), cancellationToken);
        if (string.IsNullOrWhiteSpace(sessionPhone))
            throw new BadRequestExceptions("جلسه تأیید منقضی شده است. دوباره کد بگیرید.");

        var phone = RagQuotaHelper.NormalizePhone(phoneNumber);
        if (!string.Equals(RagQuotaHelper.NormalizePhone(sessionPhone), phone, StringComparison.Ordinal))
            throw new BadRequestExceptions("اطلاعات با جلسه تأیید هم‌خوانی ندارد.");
    }
}
