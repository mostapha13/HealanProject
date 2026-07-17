using Healan.Application.Booking.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Services;
using Healan.Domain.Booking.Enums;
using Healan.Domain.Doctors.Enums;
using Healan.Domain.Patients.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
            q = q.Where(x => x.StartAt < now.Date.AddDays(45));

        return await q.OrderBy(x => x.StartAt).Take(400)
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
    public string PhoneNumber { get; set; } = string.Empty;
    public string? NationalCode { get; set; }
}

public class PortalMyBookingsQueryHandler : IRequestHandler<PortalMyBookingsQuery, List<AppointmentBookingDto>>
{
    private readonly IApplicationDbContext _db;
    public PortalMyBookingsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<AppointmentBookingDto>> Handle(PortalMyBookingsQuery request, CancellationToken cancellationToken)
    {
        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        if (phone.Length != 11)
            throw new BadRequestExceptions("شماره موبایل نامعتبر است.");

        var q = _db.AppointmentBookings.AsNoTracking()
            .Where(x => x.PhoneNumber == phone
                        && x.Status == AppointmentBookingStatus.Booked
                        && x.Slot.StartAt > DateTime.Now);

        var national = RagQuotaHelper.ToAsciiDigits(request.NationalCode);
        if (national.Length == 10)
            q = q.Where(x => x.NationalCode == national);

        return await q.OrderBy(x => x.Slot.StartAt)
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
                Status = x.Status,
                AppointmentId = x.AppointmentId,
                BookedByStaff = x.BookedByStaff,
                CreatedAt = x.CreatedAt,
                StartAt = x.Slot.StartAt,
                EndAt = x.Slot.EndAt,
                RequestedServiceTypeIds = x.RequestedServices.Select(s => s.ServiceTypeId).ToList(),
                RequestedServiceTitles = x.RequestedServices.Select(s => s.Title).ToList(),
            })
            .ToListAsync(cancellationToken);
    }
}

public class BookingOtpRequestCommand : IRequest<object>
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class BookingOtpRequestCommandHandler : IRequestHandler<BookingOtpRequestCommand, object>
{
    private static readonly TimeSpan OtpTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(90);
    private readonly IMemoryCache _cache;
    private readonly IPortalSmsSender _smsSender;

    public BookingOtpRequestCommandHandler(IMemoryCache cache, IPortalSmsSender smsSender)
    {
        _cache = cache;
        _smsSender = smsSender;
    }

    public async Task<object> Handle(BookingOtpRequestCommand request, CancellationToken cancellationToken)
    {
        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        if (phone.Length != 11 || !phone.StartsWith("09", StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل معتبر نیست (مثال: 09123456789)");

        var otpKey = $"booking_otp_{phone}";
        var metaKey = $"booking_otp_meta_{phone}";
        var cooldownKey = $"booking_otp_cd_{phone}";

        if (_cache.TryGetValue(otpKey, out string? existingCode)
            && !string.IsNullOrWhiteSpace(existingCode)
            && _cache.TryGetValue(metaKey, out OtpMeta? meta)
            && meta != null
            && meta.ExpiresAtUtc > DateTime.UtcNow)
        {
            var remaining = (int)Math.Ceiling((meta.ExpiresAtUtc - DateTime.UtcNow).TotalSeconds);
            return new
            {
                sent = true,
                reused = true,
                expiresInSeconds = Math.Max(1, remaining),
                phoneMasked = RagQuotaHelper.MaskPhone(phone),
            };
        }

        if (_cache.TryGetValue(cooldownKey, out _))
            throw new BadRequestExceptions("لطفاً کمی صبر کنید و دوباره تلاش کنید.");

        var code = Random.Shared.Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.Add(OtpTtl);

        var (ok, error) = await _smsSender.SendAsync(
            phone,
            $"کلینیک قلب دکتر معصومه شهرویی\nکد تأیید رزرو نوبت: {code}",
            cancellationToken);

        if (!ok)
            throw new BadRequestExceptions(error ?? "ارسال پیامک ناموفق بود.");

        _cache.Set(otpKey, code, OtpTtl);
        _cache.Set(metaKey, new OtpMeta(expiresAt), OtpTtl);
        _cache.Set(cooldownKey, true, ResendCooldown);

        return new
        {
            sent = true,
            reused = false,
            expiresInSeconds = (int)OtpTtl.TotalSeconds,
            phoneMasked = RagQuotaHelper.MaskPhone(phone),
        };
    }

    private sealed record OtpMeta(DateTime ExpiresAtUtc);
}

public class BookingOtpVerifyCommand : IRequest<object>
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class BookingOtpVerifyCommandHandler : IRequestHandler<BookingOtpVerifyCommand, object>
{
    private readonly IMemoryCache _cache;
    private readonly IMediator _mediator;

    public BookingOtpVerifyCommandHandler(IMemoryCache cache, IMediator mediator)
    {
        _cache = cache;
        _mediator = mediator;
    }

    public async Task<object> Handle(BookingOtpVerifyCommand request, CancellationToken cancellationToken)
    {
        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        var code = RagQuotaHelper.ToAsciiDigits(request.Code);

        if (phone.Length != 11 || !phone.StartsWith("09", StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل معتبر نیست.");
        if (code.Length != 6)
            throw new BadRequestExceptions("کد تأیید باید ۶ رقم باشد.");

        var otpKey = $"booking_otp_{phone}";
        if (!_cache.TryGetValue(otpKey, out string? expected)
            || string.IsNullOrWhiteSpace(expected)
            || !string.Equals(RagQuotaHelper.ToAsciiDigits(expected), code, StringComparison.Ordinal))
            throw new BadRequestExceptions("کد تأیید نادرست یا منقضی شده است.");

        _cache.Remove(otpKey);
        _cache.Remove($"booking_otp_meta_{phone}");

        var token = Guid.NewGuid().ToString("N");
        BookingSessionGuard.Store(_cache, token, phone);

        var patient = await _mediator.Send(new BookingLookupPatientQuery { PhoneNumber = phone }, cancellationToken);

        return new
        {
            verified = true,
            bookingToken = token,
            expiresInSeconds = 30 * 60,
            phoneNumber = phone,
            patient,
        };
    }
}

public static class BookingSessionGuard
{
    public static void Store(IMemoryCache cache, string token, string phoneNumber) =>
        cache.Set($"booking_session_{token}", new BookingSession(RagQuotaHelper.NormalizePhone(phoneNumber)), TimeSpan.FromMinutes(30));

    public static void Ensure(IMemoryCache cache, string? bookingToken, string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(bookingToken))
            throw new BadRequestExceptions("جلسه تأیید منقضی شده است. دوباره کد بگیرید.");

        var key = $"booking_session_{bookingToken.Trim()}";
        if (!cache.TryGetValue(key, out BookingSession? session) || session is null)
            throw new BadRequestExceptions("جلسه تأیید منقضی شده است. دوباره کد بگیرید.");

        var phone = RagQuotaHelper.NormalizePhone(phoneNumber);
        if (!string.Equals(session.PhoneNumber, phone, StringComparison.Ordinal))
            throw new BadRequestExceptions("اطلاعات با جلسه تأیید هم‌خوانی ندارد.");
    }

    private sealed record BookingSession(string PhoneNumber);
}
