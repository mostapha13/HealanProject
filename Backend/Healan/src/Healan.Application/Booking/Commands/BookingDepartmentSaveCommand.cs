using Healan.Application.Booking.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Booking.Entities;
using Healan.Domain.Doctors.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Booking.Commands;

public class BookingDepartmentSaveCommand : IRequest<BookingDepartmentDto>
{
    public long BookingDepartmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public MedicalGroupTypeId MedicalGroupTypeId { get; set; }
    public int SortOrder { get; set; }
    public bool SupportsComplementaryInsurance { get; set; }
    public bool IsActive { get; set; } = true;
    public List<long> ServiceTypeIds { get; set; } = new();
}

public class BookingDepartmentSaveCommandHandler : IRequestHandler<BookingDepartmentSaveCommand, BookingDepartmentDto>
{
    private readonly IApplicationDbContext _db;
    public BookingDepartmentSaveCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<BookingDepartmentDto> Handle(BookingDepartmentSaveCommand request, CancellationToken ct)
    {
        var title = request.Title.Trim();
        if (title.Length < 2) throw new BadRequestExceptions("عنوان دپارتمان الزامی است.");
        var duplicate = await _db.BookingDepartments.AnyAsync(x => x.BookingDepartmentId != request.BookingDepartmentId && x.MedicalGroupTypeId == request.MedicalGroupTypeId && x.Title == title, ct);
        if (duplicate) throw new BadRequestExceptions("این دپارتمان قبلاً برای تخصص انتخاب‌شده تعریف شده است.");

        var entity = request.BookingDepartmentId > 0
            ? await _db.BookingDepartments.Include(x => x.Services).FirstOrDefaultAsync(x => x.BookingDepartmentId == request.BookingDepartmentId, ct)
                ?? throw new NotFoundExceptions("دپارتمان یافت نشد.")
            : new BookingDepartment { CreatedAt = DateTime.UtcNow };
        if (entity.BookingDepartmentId == 0) _db.BookingDepartments.Add(entity);

        var ids = request.ServiceTypeIds.Where(x => x > 0).Distinct().ToList();
        var services = await _db.ServiceTypes.Where(x => ids.Contains(x.ServiceTypeId) && x.IsActive).ToListAsync(ct);
        if (services.Count != ids.Count) throw new BadRequestExceptions("یک یا چند خدمت انتخاب‌شده معتبر نیست.");

        entity.Title = title;
        entity.MedicalGroupTypeId = request.MedicalGroupTypeId;
        entity.SortOrder = request.SortOrder;
        entity.SupportsComplementaryInsurance = request.SupportsComplementaryInsurance;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.Services.Clear();
        foreach (var service in services) entity.Services.Add(service);
        await _db.SaveChangesAsync(ct);
        return BookingDepartmentListQueryHandler.Map(entity);
    }
}

public class BookingDepartmentDeleteCommand : IRequest<object>
{
    public long BookingDepartmentId { get; set; }
}

public class BookingDepartmentDeleteCommandHandler : IRequestHandler<BookingDepartmentDeleteCommand, object>
{
    private readonly IApplicationDbContext _db;
    public BookingDepartmentDeleteCommandHandler(IApplicationDbContext db) => _db = db;
    public async Task<object> Handle(BookingDepartmentDeleteCommand request, CancellationToken ct)
    {
        var entity = await _db.BookingDepartments.FindAsync(new object[] { request.BookingDepartmentId }, ct) ?? throw new NotFoundExceptions("دپارتمان یافت نشد.");
        if (await _db.DoctorScheduleTemplates.AnyAsync(x => x.BookingDepartmentId == request.BookingDepartmentId, ct))
            throw new BadRequestExceptions("این دپارتمان در برنامه کاری استفاده شده است؛ آن را غیرفعال کنید.");
        _db.BookingDepartments.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return new { deleted = true };
    }
}

public class BookingDepartmentListQuery : IRequest<List<BookingDepartmentDto>>
{
    public MedicalGroupTypeId? MedicalGroupTypeId { get; set; }
    public bool ActiveOnly { get; set; }
}

public class BookingDepartmentListQueryHandler : IRequestHandler<BookingDepartmentListQuery, List<BookingDepartmentDto>>
{
    private readonly IApplicationDbContext _db;
    public BookingDepartmentListQueryHandler(IApplicationDbContext db) => _db = db;
    public async Task<List<BookingDepartmentDto>> Handle(BookingDepartmentListQuery request, CancellationToken ct)
    {
        var q = _db.BookingDepartments.AsNoTracking().Include(x => x.Services).AsQueryable();
        if (request.MedicalGroupTypeId.HasValue) q = q.Where(x => x.MedicalGroupTypeId == request.MedicalGroupTypeId);
        if (request.ActiveOnly) q = q.Where(x => x.IsActive);
        return (await q.OrderBy(x => x.SortOrder).ThenBy(x => x.Title).ToListAsync(ct)).Select(Map).ToList();
    }
    internal static BookingDepartmentDto Map(BookingDepartment x) => new()
    {
        BookingDepartmentId = x.BookingDepartmentId, Title = x.Title, MedicalGroupTypeId = (int)x.MedicalGroupTypeId,
        SortOrder = x.SortOrder, SupportsComplementaryInsurance = x.SupportsComplementaryInsurance, IsActive = x.IsActive,
        ServiceTypeIds = x.Services.Select(s => s.ServiceTypeId).ToList(), ServiceTitles = x.Services.Select(s => s.Title).ToList()
    };
}
