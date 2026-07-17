using Healan.Application.Booking.Commands.BookingMutations;
using Healan.Application.Booking.Dtos;
using Healan.Application.Booking.Queries.PortalBooking;
using Healan.Application.Booking.Services;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Booking.Commands.PortalBook;

public static class PortalAccessGuard
{
    public static async Task<(string Phone, long PatientId, string FirstName, string LastName, string NationalCode)>
        EnsurePatientAsync(
            IPortalAuthTokenService tokenService,
            IBookingOtpStore? otpStore,
            IApplicationDbContext db,
            string? accessToken,
            string? bookingToken,
            string? phoneNumber,
            CancellationToken cancellationToken)
    {
        string phone;
        if (!string.IsNullOrWhiteSpace(accessToken)
            && tokenService.TryValidate(accessToken, out _, out var tokenPhone))
        {
            phone = RagQuotaHelper.NormalizePhone(tokenPhone);
        }
        else if (otpStore != null && !string.IsNullOrWhiteSpace(bookingToken))
        {
            phone = RagQuotaHelper.NormalizePhone(phoneNumber);
            await BookingSessionGuard.EnsureAsync(otpStore, bookingToken, phone, cancellationToken);
        }
        else
        {
            throw new BadRequestExceptions("برای رزرو نوبت ابتدا وارد شوید.");
        }

        if (phone.Length != 11)
            throw new BadRequestExceptions("شماره موبایل نامعتبر است.");

        var patient = await db.Patients.AsNoTracking()
            .Where(x => x.PhoneNumber == phone)
            .OrderByDescending(x => x.PatientId)
            .Select(x => new
            {
                x.PatientId,
                x.FirstName,
                x.LastName,
                x.NationalCode,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (patient == null
            || string.IsNullOrWhiteSpace(patient.FirstName)
            || string.IsNullOrWhiteSpace(patient.LastName)
            || RagQuotaHelper.ToAsciiDigits(patient.NationalCode).Length != 10)
        {
            throw new BadRequestExceptions("ابتدا مشخصات بیمار را تکمیل کنید.");
        }

        return (phone, patient.PatientId, patient.FirstName, patient.LastName,
            RagQuotaHelper.ToAsciiDigits(patient.NationalCode));
    }
}

public class PortalBookCommand : IRequest<AppointmentBookingDto>
{
    public string? AccessToken { get; set; }
    public string? BookingToken { get; set; }
    public long AppointmentSlotId { get; set; }
    public string? NationalCode { get; set; }
    public string? PhoneNumber { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Note { get; set; }
    public List<long> RequestedServiceTypeIds { get; set; } = new();
}

public class PortalBookCommandHandler : IRequestHandler<PortalBookCommand, AppointmentBookingDto>
{
    private readonly IMediator _mediator;
    private readonly IBookingOtpStore _otpStore;
    private readonly IPortalAuthTokenService _tokenService;
    private readonly IApplicationDbContext _db;

    public PortalBookCommandHandler(
        IMediator mediator,
        IBookingOtpStore otpStore,
        IPortalAuthTokenService tokenService,
        IApplicationDbContext db)
    {
        _mediator = mediator;
        _otpStore = otpStore;
        _tokenService = tokenService;
        _db = db;
    }

    public async Task<AppointmentBookingDto> Handle(PortalBookCommand request, CancellationToken cancellationToken)
    {
        var profile = await PortalAccessGuard.EnsurePatientAsync(
            _tokenService, _otpStore, _db,
            request.AccessToken, request.BookingToken, request.PhoneNumber, cancellationToken);

        return await _mediator.Send(new BookingCreateCommand
        {
            AppointmentSlotId = request.AppointmentSlotId,
            NationalCode = profile.NationalCode,
            PhoneNumber = profile.Phone,
            FirstName = profile.FirstName,
            LastName = profile.LastName,
            Note = request.Note,
            RequestedServiceTypeIds = request.RequestedServiceTypeIds,
            BookedByStaff = false,
            PatientId = profile.PatientId,
        }, cancellationToken);
    }
}

public class PortalCancelBookingCommand : IRequest<object>
{
    public string? AccessToken { get; set; }
    public string? BookingToken { get; set; }
    public long AppointmentBookingId { get; set; }
    public string? NationalCode { get; set; }
    public string? PhoneNumber { get; set; }
}

public class PortalCancelBookingCommandHandler : IRequestHandler<PortalCancelBookingCommand, object>
{
    private readonly IMediator _mediator;
    private readonly IBookingOtpStore _otpStore;
    private readonly IPortalAuthTokenService _tokenService;
    private readonly IApplicationDbContext _db;

    public PortalCancelBookingCommandHandler(
        IMediator mediator,
        IBookingOtpStore otpStore,
        IPortalAuthTokenService tokenService,
        IApplicationDbContext db)
    {
        _mediator = mediator;
        _otpStore = otpStore;
        _tokenService = tokenService;
        _db = db;
    }

    public async Task<object> Handle(PortalCancelBookingCommand request, CancellationToken cancellationToken)
    {
        var profile = await PortalAccessGuard.EnsurePatientAsync(
            _tokenService, _otpStore, _db,
            request.AccessToken, request.BookingToken, request.PhoneNumber, cancellationToken);

        return await _mediator.Send(new BookingCancelCommand
        {
            AppointmentBookingId = request.AppointmentBookingId,
            NationalCode = profile.NationalCode,
            PhoneNumber = profile.Phone,
            ByStaff = false,
        }, cancellationToken);
    }
}

public class PortalRescheduleBookingCommand : IRequest<AppointmentBookingDto>
{
    public string? AccessToken { get; set; }
    public string? BookingToken { get; set; }
    public long AppointmentBookingId { get; set; }
    public long NewAppointmentSlotId { get; set; }
    public string? NationalCode { get; set; }
    public string? PhoneNumber { get; set; }
}

public class PortalRescheduleBookingCommandHandler : IRequestHandler<PortalRescheduleBookingCommand, AppointmentBookingDto>
{
    private readonly IMediator _mediator;
    private readonly IBookingOtpStore _otpStore;
    private readonly IPortalAuthTokenService _tokenService;
    private readonly IApplicationDbContext _db;

    public PortalRescheduleBookingCommandHandler(
        IMediator mediator,
        IBookingOtpStore otpStore,
        IPortalAuthTokenService tokenService,
        IApplicationDbContext db)
    {
        _mediator = mediator;
        _otpStore = otpStore;
        _tokenService = tokenService;
        _db = db;
    }

    public async Task<AppointmentBookingDto> Handle(PortalRescheduleBookingCommand request, CancellationToken cancellationToken)
    {
        var profile = await PortalAccessGuard.EnsurePatientAsync(
            _tokenService, _otpStore, _db,
            request.AccessToken, request.BookingToken, request.PhoneNumber, cancellationToken);

        return await _mediator.Send(new BookingRescheduleCommand
        {
            AppointmentBookingId = request.AppointmentBookingId,
            NewAppointmentSlotId = request.NewAppointmentSlotId,
            NationalCode = profile.NationalCode,
            PhoneNumber = profile.Phone,
            ByStaff = false,
        }, cancellationToken);
    }
}
