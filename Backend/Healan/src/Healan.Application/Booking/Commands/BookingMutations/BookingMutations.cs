using Healan.Application.Booking.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Services;
using Healan.Domain.Booking.Entities;
using Healan.Domain.Booking.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Booking.Commands.BookingMutations;

public class BookingCreateCommand : IRequest<AppointmentBookingDto>
{
    public long AppointmentSlotId { get; set; }
    public string NationalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Note { get; set; }
    public List<long> RequestedServiceTypeIds { get; set; } = new();
    public bool BookedByStaff { get; set; }
    public long? PatientId { get; set; }
}

public class BookingCreateCommandHandler : IRequestHandler<BookingCreateCommand, AppointmentBookingDto>
{
    private readonly IApplicationDbContext _db;
    public BookingCreateCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<AppointmentBookingDto> Handle(BookingCreateCommand request, CancellationToken cancellationToken)
    {
        var national = RagQuotaHelper.ToAsciiDigits(request.NationalCode);
        if (national.Length != 10)
            throw new BadRequestExceptions("کد ملی معتبر نیست.");

        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        if (phone.Length != 11 || !phone.StartsWith("09", StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل معتبر نیست.");

        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw new BadRequestExceptions("نام و نام خانوادگی الزامی است.");

        var now = DateTime.Now;
        var slot = await _db.AppointmentSlots
            .Include(x => x.Booking)
            .Include(x => x.Doctor)
            .FirstOrDefaultAsync(x => x.AppointmentSlotId == request.AppointmentSlotId, cancellationToken)
            ?? throw new NotFoundExceptions("اسلات یافت نشد.");

        if (slot.Status != AppointmentSlotStatus.Open || slot.Booking != null)
            throw new BadRequestExceptions("این نوبت قابل رزرو نیست.");
        if (slot.StartAt <= now)
            throw new BadRequestExceptions("نوبت‌های گذشته قابل رزرو نیستند.");

        long? patientId = request.PatientId;
        if (patientId is null or <= 0)
        {
            var patient = await _db.Patients.AsNoTracking()
                .FirstOrDefaultAsync(x => x.NationalCode == national, cancellationToken);
            patientId = patient?.PatientId;
        }

        var services = new List<Domain.PublicInfos.Entities.ServiceType>();
        if (request.RequestedServiceTypeIds.Count > 0)
        {
            services = await _db.ServiceTypes
                .Where(s => request.RequestedServiceTypeIds.Contains(s.ServiceTypeId) && s.IsActive)
                .ToListAsync(cancellationToken);
        }

        var booking = new AppointmentBooking
        {
            AppointmentSlotId = slot.AppointmentSlotId,
            DoctorId = slot.DoctorId,
            PatientId = patientId,
            NationalCode = national,
            PhoneNumber = phone,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Note = request.Note,
            Status = AppointmentBookingStatus.Booked,
            BookedByStaff = request.BookedByStaff,
            CreatedAt = DateTime.UtcNow,
            RequestedServices = services,
        };

        slot.Status = AppointmentSlotStatus.Booked;
        _db.AppointmentBookings.Add(booking);
        await _db.SaveChangesAsync(cancellationToken);

        return Map(booking, slot);
    }

    internal static AppointmentBookingDto Map(AppointmentBooking booking, AppointmentSlot slot) => new()
    {
        AppointmentBookingId = booking.AppointmentBookingId,
        AppointmentSlotId = booking.AppointmentSlotId,
        DoctorId = booking.DoctorId,
        DoctorName = slot.Doctor is null ? null : $"{slot.Doctor.FirstName} {slot.Doctor.LastName}".Trim(),
        PatientId = booking.PatientId,
        NationalCode = booking.NationalCode,
        PhoneNumber = booking.PhoneNumber,
        FirstName = booking.FirstName,
        LastName = booking.LastName,
        Note = booking.Note,
        Status = booking.Status,
        AppointmentId = booking.AppointmentId,
        BookedByStaff = booking.BookedByStaff,
        CreatedAt = booking.CreatedAt,
        StartAt = slot.StartAt,
        EndAt = slot.EndAt,
        RequestedServiceTypeIds = booking.RequestedServices?.Select(s => s.ServiceTypeId).ToList() ?? new(),
        RequestedServiceTitles = booking.RequestedServices?.Select(s => s.Title).ToList() ?? new(),
    };
}

public class BookingCancelCommand : IRequest<object>
{
    public long AppointmentBookingId { get; set; }
    public string? NationalCode { get; set; }
    public string? PhoneNumber { get; set; }
    public bool ByStaff { get; set; }
}

public class BookingCancelCommandHandler : IRequestHandler<BookingCancelCommand, object>
{
    private readonly IApplicationDbContext _db;
    public BookingCancelCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<object> Handle(BookingCancelCommand request, CancellationToken cancellationToken)
    {
        var booking = await _db.AppointmentBookings
            .Include(x => x.Slot)
            .FirstOrDefaultAsync(x => x.AppointmentBookingId == request.AppointmentBookingId, cancellationToken)
            ?? throw new NotFoundExceptions("رزرو یافت نشد.");

        if (!request.ByStaff)
        {
            var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
            var national = RagQuotaHelper.ToAsciiDigits(request.NationalCode);
            var phoneOk = phone.Length == 11 && string.Equals(booking.PhoneNumber, phone, StringComparison.Ordinal);
            var nationalOk = national.Length == 10 && string.Equals(booking.NationalCode, national, StringComparison.Ordinal);
            if (!phoneOk && !nationalOk)
                throw new BadRequestExceptions("اجازه لغو این رزرو را ندارید.");
        }

        if (booking.Status is AppointmentBookingStatus.Cancelled or AppointmentBookingStatus.Accepted)
            throw new BadRequestExceptions("این رزرو قابل لغو نیست.");

        booking.Status = AppointmentBookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.UpdatedAt = DateTime.UtcNow;
        if (booking.Slot.Status == AppointmentSlotStatus.Booked)
            booking.Slot.Status = AppointmentSlotStatus.Open;

        await _db.SaveChangesAsync(cancellationToken);
        return new { cancelled = true };
    }
}

public class BookingRescheduleCommand : IRequest<AppointmentBookingDto>
{
    public long AppointmentBookingId { get; set; }
    public long NewAppointmentSlotId { get; set; }
    public string? NationalCode { get; set; }
    public string? PhoneNumber { get; set; }
    public bool ByStaff { get; set; }
}

public class BookingRescheduleCommandHandler : IRequestHandler<BookingRescheduleCommand, AppointmentBookingDto>
{
    private readonly IApplicationDbContext _db;
    public BookingRescheduleCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<AppointmentBookingDto> Handle(BookingRescheduleCommand request, CancellationToken cancellationToken)
    {
        var booking = await _db.AppointmentBookings
            .Include(x => x.Slot).ThenInclude(s => s.Doctor)
            .Include(x => x.RequestedServices)
            .FirstOrDefaultAsync(x => x.AppointmentBookingId == request.AppointmentBookingId, cancellationToken)
            ?? throw new NotFoundExceptions("رزرو یافت نشد.");

        if (!request.ByStaff)
        {
            var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
            var national = RagQuotaHelper.ToAsciiDigits(request.NationalCode);
            var phoneOk = phone.Length == 11 && string.Equals(booking.PhoneNumber, phone, StringComparison.Ordinal);
            var nationalOk = national.Length == 10 && string.Equals(booking.NationalCode, national, StringComparison.Ordinal);
            if (!phoneOk && !nationalOk)
                throw new BadRequestExceptions("اجازه جابجایی این رزرو را ندارید.");
        }

        if (booking.Status != AppointmentBookingStatus.Booked)
            throw new BadRequestExceptions("فقط رزرو فعال قابل جابجایی است.");

        var now = DateTime.Now;
        var newSlot = await _db.AppointmentSlots
            .Include(x => x.Booking)
            .Include(x => x.Doctor)
            .FirstOrDefaultAsync(x => x.AppointmentSlotId == request.NewAppointmentSlotId, cancellationToken)
            ?? throw new NotFoundExceptions("اسلات جدید یافت نشد.");

        if (newSlot.DoctorId != booking.DoctorId)
            throw new BadRequestExceptions("اسلات باید متعلق به همان پزشک باشد.");
        if (newSlot.Status != AppointmentSlotStatus.Open || newSlot.Booking != null)
            throw new BadRequestExceptions("اسلات جدید آزاد نیست.");
        if (newSlot.StartAt <= now)
            throw new BadRequestExceptions("نوبت‌های گذشته قابل انتخاب نیستند.");

        booking.Slot.Status = AppointmentSlotStatus.Open;
        booking.AppointmentSlotId = newSlot.AppointmentSlotId;
        booking.Status = AppointmentBookingStatus.Booked;
        booking.UpdatedAt = DateTime.UtcNow;
        newSlot.Status = AppointmentSlotStatus.Booked;

        await _db.SaveChangesAsync(cancellationToken);
        return BookingCreateCommandHandler.Map(booking, newSlot);
    }
}

public class BookingMoveCommand : IRequest<AppointmentBookingDto>
{
    public long AppointmentBookingId { get; set; }
    public long NewAppointmentSlotId { get; set; }
    public string? Note { get; set; }
}

public class BookingMoveCommandHandler : IRequestHandler<BookingMoveCommand, AppointmentBookingDto>
{
    private readonly IMediator _mediator;
    public BookingMoveCommandHandler(IMediator mediator) => _mediator = mediator;

    public Task<AppointmentBookingDto> Handle(BookingMoveCommand request, CancellationToken cancellationToken) =>
        _mediator.Send(new BookingRescheduleCommand
        {
            AppointmentBookingId = request.AppointmentBookingId,
            NewAppointmentSlotId = request.NewAppointmentSlotId,
            ByStaff = true,
        }, cancellationToken);
}

public class BookingUpdateNoteCommand : IRequest<object>
{
    public long AppointmentBookingId { get; set; }
    public string? Note { get; set; }
}

public class BookingUpdateNoteCommandHandler : IRequestHandler<BookingUpdateNoteCommand, object>
{
    private readonly IApplicationDbContext _db;
    public BookingUpdateNoteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<object> Handle(BookingUpdateNoteCommand request, CancellationToken cancellationToken)
    {
        var booking = await _db.AppointmentBookings
            .FirstOrDefaultAsync(x => x.AppointmentBookingId == request.AppointmentBookingId, cancellationToken)
            ?? throw new NotFoundExceptions("رزرو یافت نشد.");
        booking.Note = request.Note;
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return new { updated = true };
    }
}

public class BookingAcceptCommand : IRequest<BookingAcceptResultDto>
{
    public long AppointmentBookingId { get; set; }
}

public class BookingAcceptCommandHandler : IRequestHandler<BookingAcceptCommand, BookingAcceptResultDto>
{
    private readonly IApplicationDbContext _db;
    public BookingAcceptCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<BookingAcceptResultDto> Handle(BookingAcceptCommand request, CancellationToken cancellationToken)
    {
        var booking = await _db.AppointmentBookings
            .Include(x => x.Slot)
            .Include(x => x.RequestedServices)
            .FirstOrDefaultAsync(x => x.AppointmentBookingId == request.AppointmentBookingId, cancellationToken)
            ?? throw new NotFoundExceptions("رزرو یافت نشد.");

        if (booking.Status != AppointmentBookingStatus.Booked)
            throw new BadRequestExceptions("فقط رزرو فعال قابل پذیرش است.");

        booking.Status = AppointmentBookingStatus.Accepted;
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        var duration = (int)(booking.Slot.EndAt - booking.Slot.StartAt).TotalMinutes;
        var query = new List<string>
        {
            $"bookingId={booking.AppointmentBookingId}",
            $"doctorId={booking.DoctorId}",
            $"appointmentDate={Uri.EscapeDataString(booking.Slot.StartAt.ToString("o"))}",
            $"durationMinutes={duration}",
            $"nationalCode={Uri.EscapeDataString(booking.NationalCode)}",
            $"phone={Uri.EscapeDataString(booking.PhoneNumber)}",
            $"firstName={Uri.EscapeDataString(booking.FirstName)}",
            $"lastName={Uri.EscapeDataString(booking.LastName)}",
        };
        if (booking.PatientId is > 0)
            query.Add($"patientId={booking.PatientId}");
        if (booking.RequestedServices.Count > 0)
            query.Add($"serviceTypeIds={string.Join(',', booking.RequestedServices.Select(s => s.ServiceTypeId))}");

        return new BookingAcceptResultDto
        {
            AppointmentBookingId = booking.AppointmentBookingId,
            PatientId = booking.PatientId,
            DoctorId = booking.DoctorId,
            AppointmentDate = booking.Slot.StartAt,
            DurationMinutes = duration > 0 ? duration : null,
            Note = booking.Note,
            SuggestedServiceTypeIds = booking.RequestedServices.Select(s => s.ServiceTypeId).ToList(),
            RegisterPath = "/appointments?" + string.Join('&', query),
        };
    }
}

public class SlotBlockCommand : IRequest<object>
{
    public long AppointmentSlotId { get; set; }
    public bool Block { get; set; }
    public string? Note { get; set; }
}

public class SlotBlockCommandHandler : IRequestHandler<SlotBlockCommand, object>
{
    private readonly IApplicationDbContext _db;
    public SlotBlockCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<object> Handle(SlotBlockCommand request, CancellationToken cancellationToken)
    {
        var slot = await _db.AppointmentSlots
            .Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.AppointmentSlotId == request.AppointmentSlotId, cancellationToken)
            ?? throw new NotFoundExceptions("اسلات یافت نشد.");

        if (slot.Booking != null && slot.Booking.Status == AppointmentBookingStatus.Booked)
            throw new BadRequestExceptions("اسلات رزرو‌شده را نمی‌توان مسدود کرد.");

        slot.Status = request.Block ? AppointmentSlotStatus.Blocked : AppointmentSlotStatus.Open;
        slot.Note = request.Note ?? slot.Note;
        await _db.SaveChangesAsync(cancellationToken);
        return new { updated = true, status = slot.Status };
    }
}

public class SlotManualCreateCommand : IRequest<AppointmentSlotDto>
{
    public long DoctorId { get; set; }
    public DateTime StartAt { get; set; }
    public int VisitDurationMinutes { get; set; } = 30;
    public string? Note { get; set; }
}

public class SlotManualCreateCommandHandler : IRequestHandler<SlotManualCreateCommand, AppointmentSlotDto>
{
    private readonly IApplicationDbContext _db;
    public SlotManualCreateCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<AppointmentSlotDto> Handle(SlotManualCreateCommand request, CancellationToken cancellationToken)
    {
        if (request.VisitDurationMinutes <= 0)
            throw new BadRequestExceptions("مدت ویزیت نامعتبر است.");
        if (request.StartAt <= DateTime.Now)
            throw new BadRequestExceptions("زمان اسلات باید در آینده باشد.");

        var doctor = await _db.Doctors.AsNoTracking()
            .FirstOrDefaultAsync(x => x.DoctorId == request.DoctorId, cancellationToken)
            ?? throw new NotFoundExceptions("پزشک یافت نشد.");

        if (await _db.AppointmentSlots.AnyAsync(x => x.DoctorId == request.DoctorId && x.StartAt == request.StartAt, cancellationToken))
            throw new BadRequestExceptions("اسلات در این زمان از قبل وجود دارد.");

        var slot = new AppointmentSlot
        {
            DoctorId = request.DoctorId,
            StartAt = request.StartAt,
            EndAt = request.StartAt.AddMinutes(request.VisitDurationMinutes),
            Status = AppointmentSlotStatus.Open,
            Source = AppointmentSlotSource.Manual,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow,
        };
        _db.AppointmentSlots.Add(slot);
        await _db.SaveChangesAsync(cancellationToken);

        return new AppointmentSlotDto
        {
            AppointmentSlotId = slot.AppointmentSlotId,
            DoctorId = slot.DoctorId,
            DoctorName = $"{doctor.FirstName} {doctor.LastName}".Trim(),
            StartAt = slot.StartAt,
            EndAt = slot.EndAt,
            Status = slot.Status,
            Source = slot.Source,
            Note = slot.Note,
        };
    }
}
