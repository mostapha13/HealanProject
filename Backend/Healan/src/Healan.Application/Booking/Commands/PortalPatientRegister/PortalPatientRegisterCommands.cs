using Healan.Application.Common.Const;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Dtos;
using Healan.Application.Portal.Services;
using Healan.Domain.Patients.Entities;
using Healan.Domain.Users.Entities;
using Healan.Domain.Users.Enums;
using IdentityServer.GrpcClient;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Models.UserAccessModels;

namespace Healan.Application.Booking.Commands.PortalPatientRegister;

public class BookingRegisterOtpRequestCommand : IRequest<object>
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string NationalCode { get; set; } = string.Empty;
}

public class BookingRegisterOtpRequestCommandHandler : IRequestHandler<BookingRegisterOtpRequestCommand, object>
{
    private static readonly TimeSpan OtpTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);
    private readonly IMemoryCache _cache;
    private readonly IPortalSmsSender _smsSender;

    public BookingRegisterOtpRequestCommandHandler(IMemoryCache cache, IPortalSmsSender smsSender)
    {
        _cache = cache;
        _smsSender = smsSender;
    }

    public async Task<object> Handle(BookingRegisterOtpRequestCommand request, CancellationToken cancellationToken)
    {
        var draft = PortalPatientRegistrar.ValidateDraft(
            request.PhoneNumber, request.FirstName, request.LastName, request.NationalCode);

        var cdKey = $"portal_booking_reg_cd_{draft.Phone}";
        if (_cache.TryGetValue(cdKey, out _))
            throw new BadRequestExceptions("لطفاً کمی صبر کنید و دوباره تلاش کنید.");

        var code = Random.Shared.Next(100000, 999999).ToString();
        draft.Code = code;
        _cache.Set($"portal_booking_reg_{draft.Phone}", draft, OtpTtl);
        _cache.Set(cdKey, true, ResendCooldown);

        var (ok, error) = await _smsSender.SendAsync(
            draft.Phone,
            $"کلینیک قلب دکتر معصومه شهرویی\nکد تأیید ثبت‌نام و رزرو نوبت: {code}",
            cancellationToken);

        if (!ok)
        {
            _cache.Remove($"portal_booking_reg_{draft.Phone}");
            throw new BadRequestExceptions(error ?? "ارسال پیامک ناموفق بود.");
        }

        return new
        {
            sent = true,
            expiresInSeconds = (int)OtpTtl.TotalSeconds,
            phoneMasked = RagQuotaHelper.MaskPhone(draft.Phone),
        };
    }
}

public class BookingRegisterOtpVerifyCommand : IRequest<PortalBookingAuthResultDto>
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class BookingRegisterOtpVerifyCommandHandler : IRequestHandler<BookingRegisterOtpVerifyCommand, PortalBookingAuthResultDto>
{
    private readonly IMemoryCache _cache;
    private readonly PortalPatientRegistrar _registrar;
    private readonly IPortalAuthTokenService _tokenService;

    public BookingRegisterOtpVerifyCommandHandler(
        IMemoryCache cache,
        PortalPatientRegistrar registrar,
        IPortalAuthTokenService tokenService)
    {
        _cache = cache;
        _registrar = registrar;
        _tokenService = tokenService;
    }

    public async Task<PortalBookingAuthResultDto> Handle(
        BookingRegisterOtpVerifyCommand request,
        CancellationToken cancellationToken)
    {
        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        var code = RagQuotaHelper.ToAsciiDigits(request.Code);
        if (phone.Length != 11 || !phone.StartsWith("09", StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل معتبر نیست.");
        if (code.Length < 4)
            throw new BadRequestExceptions("کد تأیید نامعتبر است.");

        var cacheKey = $"portal_booking_reg_{phone}";
        if (!_cache.TryGetValue(cacheKey, out PortalPatientDraft? draft)
            || draft == null
            || !string.Equals(RagQuotaHelper.ToAsciiDigits(draft.Code), code, StringComparison.Ordinal))
            throw new BadRequestExceptions("کد تأیید نادرست یا منقضی شده است. دوباره درخواست کد دهید.");

        _cache.Remove(cacheKey);
        _cache.Remove($"portal_booking_reg_cd_{phone}");

        var result = await _registrar.RegisterOrUpdateAsync(draft, cancellationToken);
        var token = _tokenService.CreateToken(result.IdentityUserId, result.PhoneNumber, out var expiresAt);
        return new PortalBookingAuthResultDto
        {
            AccessToken = token,
            UserId = result.IdentityUserId,
            PhoneNumber = result.PhoneNumber,
            PhoneMasked = RagQuotaHelper.MaskPhone(result.PhoneNumber),
            ExpiresAtUtc = expiresAt,
            PatientId = result.PatientId,
            FirstName = result.FirstName,
            LastName = result.LastName,
            NationalCode = result.NationalCode,
            IsPatient = true,
        };
    }
}

public class BookingCompleteProfileCommand : IRequest<PortalBookingAuthResultDto>
{
    public string? AccessToken { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string NationalCode { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class BookingCompleteProfileCommandHandler : IRequestHandler<BookingCompleteProfileCommand, PortalBookingAuthResultDto>
{
    private readonly IPortalAuthTokenService _tokenService;
    private readonly PortalPatientRegistrar _registrar;

    public BookingCompleteProfileCommandHandler(
        IPortalAuthTokenService tokenService,
        PortalPatientRegistrar registrar)
    {
        _tokenService = tokenService;
        _registrar = registrar;
    }

    public async Task<PortalBookingAuthResultDto> Handle(
        BookingCompleteProfileCommand request,
        CancellationToken cancellationToken)
    {
        if (!_tokenService.TryValidate(request.AccessToken, out var identityUserId, out var phoneFromToken))
            throw new BadRequestExceptions("جلسه ورود منقضی شده است. دوباره وارد شوید.");

        var phone = RagQuotaHelper.NormalizePhone(
            string.IsNullOrWhiteSpace(request.PhoneNumber) ? phoneFromToken : request.PhoneNumber);
        if (phone.Length != 11 || !string.Equals(phone, RagQuotaHelper.NormalizePhone(phoneFromToken), StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل با جلسه ورود هم‌خوانی ندارد.");

        var draft = PortalPatientRegistrar.ValidateDraft(
            phone, request.FirstName, request.LastName, request.NationalCode);
        draft.ExistingIdentityUserId = identityUserId;

        var result = await _registrar.RegisterOrUpdateAsync(draft, cancellationToken);
        var token = _tokenService.CreateToken(result.IdentityUserId, result.PhoneNumber, out var expiresAt);
        return new PortalBookingAuthResultDto
        {
            AccessToken = token,
            UserId = result.IdentityUserId,
            PhoneNumber = result.PhoneNumber,
            PhoneMasked = RagQuotaHelper.MaskPhone(result.PhoneNumber),
            ExpiresAtUtc = expiresAt,
            PatientId = result.PatientId,
            FirstName = result.FirstName,
            LastName = result.LastName,
            NationalCode = result.NationalCode,
            IsPatient = true,
        };
    }
}

public class BookingProfileStatusQuery : IRequest<PortalBookingAuthResultDto>
{
    public string? AccessToken { get; set; }
}

public class BookingProfileStatusQueryHandler : IRequestHandler<BookingProfileStatusQuery, PortalBookingAuthResultDto>
{
    private readonly IPortalAuthTokenService _tokenService;
    private readonly IApplicationDbContext _db;

    public BookingProfileStatusQueryHandler(IPortalAuthTokenService tokenService, IApplicationDbContext db)
    {
        _tokenService = tokenService;
        _db = db;
    }

    public async Task<PortalBookingAuthResultDto> Handle(
        BookingProfileStatusQuery request,
        CancellationToken cancellationToken)
    {
        if (!_tokenService.TryValidate(request.AccessToken, out var userId, out var phone))
        {
            return new PortalBookingAuthResultDto { IsAuthenticated = false, IsPatient = false };
        }

        phone = RagQuotaHelper.NormalizePhone(phone);
        var patient = await _db.Patients.AsNoTracking()
            .Where(x => x.PhoneNumber == phone || x.User.IdentityUserId == userId)
            .OrderByDescending(x => x.PatientId)
            .Select(x => new
            {
                x.PatientId,
                x.FirstName,
                x.LastName,
                x.NationalCode,
                x.PhoneNumber,
            })
            .FirstOrDefaultAsync(cancellationToken);

        var isPatient = patient != null
            && !string.IsNullOrWhiteSpace(patient.FirstName)
            && !string.IsNullOrWhiteSpace(patient.LastName)
            && RagQuotaHelper.ToAsciiDigits(patient.NationalCode).Length == 10;

        return new PortalBookingAuthResultDto
        {
            IsAuthenticated = true,
            IsPatient = isPatient,
            UserId = userId,
            PhoneNumber = phone,
            PhoneMasked = RagQuotaHelper.MaskPhone(phone),
            PatientId = patient?.PatientId,
            FirstName = patient?.FirstName ?? string.Empty,
            LastName = patient?.LastName ?? string.Empty,
            NationalCode = patient?.NationalCode ?? string.Empty,
            AccessToken = request.AccessToken ?? string.Empty,
        };
    }
}

public class PortalBookingAuthResultDto
{
    public bool IsAuthenticated { get; set; } = true;
    public bool IsPatient { get; set; }
    public string AccessToken { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PhoneMasked { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public long? PatientId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string NationalCode { get; set; } = string.Empty;
}

public sealed class PortalPatientDraft
{
    public string Phone { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string NationalCode { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Guid? ExistingIdentityUserId { get; set; }
}

public sealed class PortalPatientRegisterResult
{
    public Guid IdentityUserId { get; set; }
    public long PatientId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string NationalCode { get; set; } = string.Empty;
}

/// <summary>
/// Creates/updates Healan Patient using the same Identity role path as clinic PatientRegister (Healan role).
/// Also ensures SiteUser so chatbot login stays shared.
/// </summary>
public sealed class PortalPatientRegistrar
{
    private readonly IApplicationDbContext _db;
    private readonly IIdentityTool _identityTool;

    public PortalPatientRegistrar(IApplicationDbContext db, IIdentityTool identityTool)
    {
        _db = db;
        _identityTool = identityTool;
    }

    public static PortalPatientDraft ValidateDraft(
        string? phoneNumber,
        string? firstName,
        string? lastName,
        string? nationalCode)
    {
        var phone = RagQuotaHelper.NormalizePhone(phoneNumber);
        var national = RagQuotaHelper.ToAsciiDigits(nationalCode);
        var first = (firstName ?? string.Empty).Trim();
        var last = (lastName ?? string.Empty).Trim();

        if (phone.Length != 11 || !phone.StartsWith("09", StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل معتبر نیست (مثال: 09123456789)");
        if (first.Length < 2)
            throw new BadRequestExceptions("نام را وارد کنید.");
        if (last.Length < 2)
            throw new BadRequestExceptions("نام خانوادگی را وارد کنید.");
        if (national.Length != 10)
            throw new BadRequestExceptions("کد ملی باید ۱۰ رقم باشد.");

        return new PortalPatientDraft
        {
            Phone = phone,
            FirstName = first,
            LastName = last,
            NationalCode = national,
        };
    }

    public async Task<PortalPatientRegisterResult> RegisterOrUpdateAsync(
        PortalPatientDraft draft,
        CancellationToken cancellationToken)
    {
        var existingPatient = await _db.Patients
            .Include(x => x.User)
            .FirstOrDefaultAsync(
                x => x.NationalCode == draft.NationalCode || x.PhoneNumber == draft.Phone,
                cancellationToken);

        if (existingPatient != null
            && !string.Equals(existingPatient.NationalCode, draft.NationalCode, StringComparison.Ordinal)
            && !string.IsNullOrWhiteSpace(existingPatient.NationalCode)
            && existingPatient.NationalCode.Length == 10)
        {
            // Same phone, different national — update to submitted profile for portal self-service
        }

        if (existingPatient != null
            && string.Equals(existingPatient.NationalCode, draft.NationalCode, StringComparison.Ordinal)
            && !string.Equals(RagQuotaHelper.NormalizePhone(existingPatient.PhoneNumber), draft.Phone, StringComparison.Ordinal)
            && !string.IsNullOrWhiteSpace(existingPatient.PhoneNumber))
        {
            throw new BadRequestExceptions("این کد ملی با شماره موبایل دیگری ثبت شده است.");
        }

        User? healanUser = existingPatient?.User;
        if (healanUser == null)
        {
            healanUser = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.PhoneNumber == draft.Phone
                         || (draft.ExistingIdentityUserId != null && x.IdentityUserId == draft.ExistingIdentityUserId),
                    cancellationToken);
        }

        if (healanUser == null)
        {
            healanUser = new User();
            _db.Users.Add(healanUser);
        }

        var identityUserIdHint = draft.ExistingIdentityUserId?.ToString()
            ?? healanUser.IdentityUserId?.ToString()
            ?? string.Empty;

        var isNewIdentity = string.IsNullOrWhiteSpace(identityUserIdHint);
        var identityUser = await _identityTool.SaveUser(new SaveRequest
        {
            UserId = identityUserIdHint,
            IsActive = true,
            DepartmentId = (int)DepartmentId.Public,
            FirstName = draft.FirstName,
            LastName = draft.LastName,
            PhoneNumber = draft.Phone,
            Password = isNewIdentity ? PatientIdentityDefaults.InitialPassword : string.Empty,
            TwoFactorEnabled = false,
        });

        if (identityUser == null || string.IsNullOrWhiteSpace(identityUser.UserId)
            || !Guid.TryParse(identityUser.UserId, out var identityGuid))
            throw new BadRequestExceptions("امکان ایجاد/یافتن کاربر فراهم نشد. دوباره تلاش کنید.");

        await PortalAspNetRoleHelper.EnsureAsync(_identityTool, identityGuid, includePatient: true);

        var roleRequest = new SetUserSystemRoleRequest
        {
            UserId = identityGuid.ToString(),
            AccessSystemId = (int)AccessSystemId.Healan,
        };
        roleRequest.RoleNames.Add(nameof(UserAccesRoleId.Healan));
        roleRequest.RoleNames.Add(nameof(UserAccesRoleId.Patient));
        var userSummary = await _identityTool.SetUserSystemRole(roleRequest);
        if (userSummary == null || string.IsNullOrWhiteSpace(userSummary.UserId))
            throw new BadRequestExceptions("خطا در تخصیص نقش بیمار.");

        healanUser.IdentityUserId = identityGuid;
        healanUser.FirstName = draft.FirstName;
        healanUser.LastName = draft.LastName;
        healanUser.PhoneNumber = draft.Phone;
        healanUser.IsActive = true;
        healanUser.UserTypeId = UserTypeId.Patient;

        await _db.SaveChangesAsync(cancellationToken);

        var patient = existingPatient;
        if (patient == null)
        {
            patient = await _db.Patients
                .FirstOrDefaultAsync(x => x.NationalCode == draft.NationalCode, cancellationToken);
        }

        if (patient == null)
        {
            patient = new Patient();
            _db.Patients.Add(patient);
        }

        patient.UserId = healanUser.UserId;
        patient.FirstName = draft.FirstName;
        patient.LastName = draft.LastName;
        patient.NationalCode = draft.NationalCode;
        patient.PhoneNumber = draft.Phone;

        await _db.SaveChangesAsync(cancellationToken);

        return new PortalPatientRegisterResult
        {
            IdentityUserId = identityGuid,
            PatientId = patient.PatientId,
            PhoneNumber = draft.Phone,
            FirstName = draft.FirstName,
            LastName = draft.LastName,
            NationalCode = draft.NationalCode,
        };
    }

}
