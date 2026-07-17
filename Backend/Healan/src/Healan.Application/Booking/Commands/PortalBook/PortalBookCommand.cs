using Healan.Application.Booking.Commands.BookingMutations;
using Healan.Application.Booking.Dtos;
using Healan.Application.Booking.Queries.PortalBooking;
using MediatR;
using Microsoft.Extensions.Caching.Memory;

namespace Healan.Application.Booking.Commands.PortalBook;

public class PortalBookCommand : IRequest<AppointmentBookingDto>
{
    public string BookingToken { get; set; } = string.Empty;
    public long AppointmentSlotId { get; set; }
    public string NationalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Note { get; set; }
    public List<long> RequestedServiceTypeIds { get; set; } = new();
}

public class PortalBookCommandHandler : IRequestHandler<PortalBookCommand, AppointmentBookingDto>
{
    private readonly IMediator _mediator;
    private readonly IMemoryCache _cache;

    public PortalBookCommandHandler(IMediator mediator, IMemoryCache cache)
    {
        _mediator = mediator;
        _cache = cache;
    }

    public Task<AppointmentBookingDto> Handle(PortalBookCommand request, CancellationToken cancellationToken)
    {
        BookingSessionGuard.Ensure(_cache, request.BookingToken, request.NationalCode, request.PhoneNumber);
        return _mediator.Send(new BookingCreateCommand
        {
            AppointmentSlotId = request.AppointmentSlotId,
            NationalCode = request.NationalCode,
            PhoneNumber = request.PhoneNumber,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Note = request.Note,
            RequestedServiceTypeIds = request.RequestedServiceTypeIds,
            BookedByStaff = false,
        }, cancellationToken);
    }
}

public class PortalCancelBookingCommand : IRequest<object>
{
    public string BookingToken { get; set; } = string.Empty;
    public long AppointmentBookingId { get; set; }
    public string NationalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

public class PortalCancelBookingCommandHandler : IRequestHandler<PortalCancelBookingCommand, object>
{
    private readonly IMediator _mediator;
    private readonly IMemoryCache _cache;

    public PortalCancelBookingCommandHandler(IMediator mediator, IMemoryCache cache)
    {
        _mediator = mediator;
        _cache = cache;
    }

    public Task<object> Handle(PortalCancelBookingCommand request, CancellationToken cancellationToken)
    {
        BookingSessionGuard.Ensure(_cache, request.BookingToken, request.NationalCode, request.PhoneNumber);
        return _mediator.Send(new BookingCancelCommand
        {
            AppointmentBookingId = request.AppointmentBookingId,
            NationalCode = request.NationalCode,
            ByStaff = false,
        }, cancellationToken);
    }
}

public class PortalRescheduleBookingCommand : IRequest<AppointmentBookingDto>
{
    public string BookingToken { get; set; } = string.Empty;
    public long AppointmentBookingId { get; set; }
    public long NewAppointmentSlotId { get; set; }
    public string NationalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

public class PortalRescheduleBookingCommandHandler : IRequestHandler<PortalRescheduleBookingCommand, AppointmentBookingDto>
{
    private readonly IMediator _mediator;
    private readonly IMemoryCache _cache;

    public PortalRescheduleBookingCommandHandler(IMediator mediator, IMemoryCache cache)
    {
        _mediator = mediator;
        _cache = cache;
    }

    public Task<AppointmentBookingDto> Handle(PortalRescheduleBookingCommand request, CancellationToken cancellationToken)
    {
        BookingSessionGuard.Ensure(_cache, request.BookingToken, request.NationalCode, request.PhoneNumber);
        return _mediator.Send(new BookingRescheduleCommand
        {
            AppointmentBookingId = request.AppointmentBookingId,
            NewAppointmentSlotId = request.NewAppointmentSlotId,
            NationalCode = request.NationalCode,
            ByStaff = false,
        }, cancellationToken);
    }
}
