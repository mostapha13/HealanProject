using Healan.Application.Booking.Dtos;
using Healan.Application.Booking.Services;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Services;
using Healan.Domain.Booking.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Booking.Queries;

public class ScheduleTemplateListQuery : IRequest<List<ScheduleTemplateDto>>
{
    public long? DoctorId { get; set; }
}

public class ScheduleTemplateListQueryHandler : IRequestHandler<ScheduleTemplateListQuery, List<ScheduleTemplateDto>>
{
    private readonly IApplicationDbContext _db;
    public ScheduleTemplateListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<ScheduleTemplateDto>> Handle(ScheduleTemplateListQuery request, CancellationToken cancellationToken)
    {
        var q = _db.DoctorScheduleTemplates.AsNoTracking().AsQueryable();
        if (request.DoctorId is > 0)
            q = q.Where(x => x.DoctorId == request.DoctorId);

        // Materialize first — custom FormatTime is not EF-translatable.
        var rows = await q.OrderBy(x => x.DoctorId).ThenBy(x => x.DayOfWeek)
            .Select(x => new
            {
                x.DoctorScheduleTemplateId,
                x.DoctorId,
                DoctorName = (x.Doctor.FirstName + " " + x.Doctor.LastName).Trim(),
                x.DayOfWeek,
                x.StartTime,
                x.EndTime,
                x.VisitDurationMinutes,
                x.IsActive,
            })
            .ToListAsync(cancellationToken);

        return rows.Select(x => new ScheduleTemplateDto
        {
            DoctorScheduleTemplateId = x.DoctorScheduleTemplateId,
            DoctorId = x.DoctorId,
            DoctorName = x.DoctorName,
            DayOfWeek = (int)x.DayOfWeek,
            StartTime = Booking.Services.BookingTimeHelper.FormatTime(x.StartTime),
            EndTime = Booking.Services.BookingTimeHelper.FormatTime(x.EndTime),
            VisitDurationMinutes = x.VisitDurationMinutes,
            IsActive = x.IsActive,
        }).ToList();
    }
}

public class ScheduleExceptionListQuery : IRequest<List<ScheduleExceptionDto>>
{
    public long DoctorId { get; set; }
    public string? FromDate { get; set; }
    public string? ToDate { get; set; }
}

public class ScheduleExceptionListQueryHandler : IRequestHandler<ScheduleExceptionListQuery, List<ScheduleExceptionDto>>
{
    private readonly IApplicationDbContext _db;
    public ScheduleExceptionListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<ScheduleExceptionDto>> Handle(ScheduleExceptionListQuery request, CancellationToken cancellationToken)
    {
        var q = _db.DoctorScheduleExceptions.AsNoTracking().Where(x => x.DoctorId == request.DoctorId);
        if (DateOnly.TryParse(request.FromDate, out var from))
            q = q.Where(x => x.Date >= from);
        if (DateOnly.TryParse(request.ToDate, out var to))
            q = q.Where(x => x.Date <= to);

        var rows = await q.OrderBy(x => x.Date)
            .Select(x => new
            {
                x.DoctorScheduleExceptionId,
                x.DoctorId,
                x.Date,
                x.IsClosed,
                x.StartTime,
                x.EndTime,
                x.VisitDurationMinutes,
                x.Note,
            })
            .ToListAsync(cancellationToken);

        return rows.Select(x => new ScheduleExceptionDto
        {
            DoctorScheduleExceptionId = x.DoctorScheduleExceptionId,
            DoctorId = x.DoctorId,
            Date = x.Date.ToString("yyyy-MM-dd"),
            IsClosed = x.IsClosed,
            StartTime = x.StartTime == null ? null : Booking.Services.BookingTimeHelper.FormatTime(x.StartTime.Value),
            EndTime = x.EndTime == null ? null : Booking.Services.BookingTimeHelper.FormatTime(x.EndTime.Value),
            VisitDurationMinutes = x.VisitDurationMinutes,
            Note = x.Note,
        }).ToList();
    }
}

public class AppointmentSlotListQuery : AbstractSearchRequest<PaginatedList<AppointmentSlotDto>>
{
    public long? DoctorId { get; set; }
    public string? FromDate { get; set; }
    public string? ToDate { get; set; }
    public AppointmentSlotStatus? Status { get; set; }
}

public class AppointmentSlotListQueryHandler : IRequestHandler<AppointmentSlotListQuery, PaginatedList<AppointmentSlotDto>>
{
    private readonly IApplicationDbContext _db;
    public AppointmentSlotListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<AppointmentSlotDto>> Handle(AppointmentSlotListQuery request, CancellationToken cancellationToken)
    {
        var q = _db.AppointmentSlots.AsNoTracking().AsQueryable();
        if (request.DoctorId is > 0)
            q = q.Where(x => x.DoctorId == request.DoctorId);
        if (DateOnly.TryParse(request.FromDate, out var from))
            q = q.Where(x => x.StartAt >= from.ToDateTime(TimeOnly.MinValue));
        if (DateOnly.TryParse(request.ToDate, out var to))
            q = q.Where(x => x.StartAt < to.AddDays(1).ToDateTime(TimeOnly.MinValue));
        if (request.Status.HasValue)
            q = q.Where(x => x.Status == request.Status);

        var projected = q.OrderBy(x => x.StartAt).Select(x => new AppointmentSlotDto
        {
            AppointmentSlotId = x.AppointmentSlotId,
            DoctorId = x.DoctorId,
            DoctorName = (x.Doctor.FirstName + " " + x.Doctor.LastName).Trim(),
            StartAt = x.StartAt,
            EndAt = x.EndAt,
            Status = x.Status,
            Source = x.Source,
            Note = x.Note,
            Booking = x.Booking == null ? null : new AppointmentBookingDto
            {
                AppointmentBookingId = x.Booking.AppointmentBookingId,
                AppointmentSlotId = x.Booking.AppointmentSlotId,
                DoctorId = x.Booking.DoctorId,
                PatientId = x.Booking.PatientId,
                NationalCode = x.Booking.NationalCode,
                PhoneNumber = x.Booking.PhoneNumber,
                FirstName = x.Booking.FirstName,
                LastName = x.Booking.LastName,
                Note = x.Booking.Note,
                Status = (byte)x.Booking.Status,
                AppointmentId = x.Booking.AppointmentId,
                BookedByStaff = x.Booking.BookedByStaff,
                CreatedAt = x.Booking.CreatedAt,
                StartAt = x.StartAt,
                EndAt = x.EndAt,
            },
        });

        return await projected.PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
    }
}

public class AppointmentBookingListQuery : AbstractSearchRequest<PaginatedList<AppointmentBookingDto>>
{
    public long? DoctorId { get; set; }
    public AppointmentBookingStatus? Status { get; set; }
    public string? NationalCode { get; set; }
    public string? Phone { get; set; }
    public string? FromDate { get; set; }
    public string? ToDate { get; set; }
    public string? FilterText { get; set; }
}

public class AppointmentBookingListQueryHandler : IRequestHandler<AppointmentBookingListQuery, PaginatedList<AppointmentBookingDto>>
{
    private readonly IApplicationDbContext _db;
    public AppointmentBookingListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<AppointmentBookingDto>> Handle(AppointmentBookingListQuery request, CancellationToken cancellationToken)
    {
        var q = _db.AppointmentBookings.AsNoTracking().AsQueryable();
        if (request.DoctorId is > 0)
            q = q.Where(x => x.DoctorId == request.DoctorId);
        if (request.Status.HasValue)
            q = q.Where(x => x.Status == request.Status);
        if (!string.IsNullOrWhiteSpace(request.NationalCode))
        {
            var national = RagQuotaHelper.ToAsciiDigits(request.NationalCode);
            if (national.Length > 0)
                q = q.Where(x => x.NationalCode.Contains(national));
        }
        if (!string.IsNullOrWhiteSpace(request.Phone))
            q = q.Where(x => x.PhoneNumber.Contains(RagQuotaHelper.ToAsciiDigits(request.Phone)));
        if (BookingTimeHelper.TryParseDate(request.FromDate, out var from))
            q = q.Where(x => x.Slot.StartAt >= from.ToDateTime(TimeOnly.MinValue));
        if (BookingTimeHelper.TryParseDate(request.ToDate, out var to))
            q = q.Where(x => x.Slot.StartAt < to.AddDays(1).ToDateTime(TimeOnly.MinValue));
        if (!string.IsNullOrWhiteSpace(request.FilterText))
        {
            var text = request.FilterText.Trim();
            var digits = RagQuotaHelper.ToAsciiDigits(request.FilterText);
            q = q.Where(x =>
                x.FirstName.Contains(text)
                || x.LastName.Contains(text)
                || x.NationalCode.Contains(text)
                || x.PhoneNumber.Contains(text)
                || (digits.Length > 0 && (x.NationalCode.Contains(digits) || x.PhoneNumber.Contains(digits))));
        }

        // Avoid EF translation failure on collection .ToList() inside Select.
        var projected = q.OrderByDescending(x => x.Slot.StartAt).Select(x => new AppointmentBookingDto
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
        });

        var page = await projected.PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
        if (page.Items.Count == 0)
            return page;

        var ids = page.Items.Select(x => x.AppointmentBookingId).ToList();
        try
        {
            // Flatten join instead of projecting collection (.ToList/.ToArray) which can 500 on SQL Server.
            var serviceRows = await (
                from b in _db.AppointmentBookings.AsNoTracking()
                where ids.Contains(b.AppointmentBookingId)
                from s in b.RequestedServices
                select new { b.AppointmentBookingId, s.ServiceTypeId, s.Title }
            ).ToListAsync(cancellationToken);

            var grouped = serviceRows.GroupBy(x => x.AppointmentBookingId)
                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var item in page.Items)
            {
                if (!grouped.TryGetValue(item.AppointmentBookingId, out var svc))
                    continue;
                item.RequestedServiceTypeIds = svc.Select(x => x.ServiceTypeId).ToList();
                item.RequestedServiceTitles = svc.Select(x => x.Title).ToList();
            }
        }
        catch
        {
            // Keep list usable even if join-table/M2M is missing or misconfigured.
            foreach (var item in page.Items)
            {
                item.RequestedServiceTypeIds ??= new List<long>();
                item.RequestedServiceTitles ??= new List<string>();
            }
        }

        return page;
    }
}
