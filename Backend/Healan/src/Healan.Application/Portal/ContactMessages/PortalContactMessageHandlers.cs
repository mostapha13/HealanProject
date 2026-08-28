using System.Text.RegularExpressions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Dtos;
using Healan.Domain.Portal.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.ContactMessages;

public class PortalContactMessageDto
{
    public long PortalContactMessageId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? AdminNote { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class PortalContactMessageSubmitCommand : IRequest<PortalMutationResult>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Website { get; set; }
}
public class PortalContactMessageListQuery : IRequest<List<PortalContactMessageDto>> { public bool? IsRead { get; set; } }
public class PortalContactMessageUpdateCommand : IRequest<PortalMutationResult>
{
    public long PortalContactMessageId { get; set; }
    public bool IsRead { get; set; }
    public string? AdminNote { get; set; }
}
public class PortalContactMessageDeleteCommand : IRequest<PortalMutationResult> { public long PortalContactMessageId { get; set; } }

public class PortalContactMessageSubmitCommandHandler : IRequestHandler<PortalContactMessageSubmitCommand, PortalMutationResult>
{
    private static readonly Regex MobileRegex = new("^09\\d{9}$", RegexOptions.Compiled);
    private readonly IApplicationDbContext _db;
    public PortalContactMessageSubmitCommandHandler(IApplicationDbContext db) => _db = db;
    public async Task<PortalMutationResult> Handle(PortalContactMessageSubmitCommand request, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(request.Website)) return new PortalMutationResult { Id = 0 };
        var firstName = request.FirstName?.Trim() ?? string.Empty;
        var lastName = request.LastName?.Trim() ?? string.Empty;
        var mobile = NormalizeDigits(request.Mobile);
        var message = request.Message?.Trim() ?? string.Empty;
        if (firstName.Length < 2 || firstName.Length > 100) throw new ArgumentException("نام معتبر وارد کنید");
        if (lastName.Length < 2 || lastName.Length > 100) throw new ArgumentException("نام خانوادگی معتبر وارد کنید");
        if (!MobileRegex.IsMatch(mobile)) throw new ArgumentException("شماره موبایل معتبر وارد کنید");
        if (message.Length < 10 || message.Length > 3000) throw new ArgumentException("پیام باید بین ۱۰ تا ۳۰۰۰ کاراکتر باشد");
        var recent = await _db.PortalContactMessages.CountAsync(x => x.Mobile == mobile && x.CreatedAt >= DateTime.UtcNow.AddMinutes(-10), ct);
        if (recent >= 3) throw new ArgumentException("تعداد پیام‌های ارسالی زیاد است؛ لطفاً کمی بعد تلاش کنید");
        var row = new PortalContactMessage { FirstName = firstName, LastName = lastName, Mobile = mobile, Message = message };
        _db.PortalContactMessages.Add(row);
        await _db.SaveChangesAsync(ct);
        return new PortalMutationResult { Id = row.PortalContactMessageId };
    }
    private static string NormalizeDigits(string? value) => (value ?? string.Empty).Trim()
        .Replace('۰','0').Replace('۱','1').Replace('۲','2').Replace('۳','3').Replace('۴','4')
        .Replace('۵','5').Replace('۶','6').Replace('۷','7').Replace('۸','8').Replace('۹','9')
        .Replace(" ", string.Empty).Replace("-", string.Empty);
}

public class PortalContactMessageListQueryHandler : IRequestHandler<PortalContactMessageListQuery, List<PortalContactMessageDto>>
{
    private readonly IApplicationDbContext _db;
    public PortalContactMessageListQueryHandler(IApplicationDbContext db) => _db = db;
    public async Task<List<PortalContactMessageDto>> Handle(PortalContactMessageListQuery request, CancellationToken ct)
    {
        var query = _db.PortalContactMessages.AsNoTracking().AsQueryable();
        if (request.IsRead.HasValue) query = query.Where(x => x.IsRead == request.IsRead);
        return await query.OrderBy(x => x.IsRead).ThenByDescending(x => x.CreatedAt).Select(x => new PortalContactMessageDto
        { PortalContactMessageId=x.PortalContactMessageId, FirstName=x.FirstName, LastName=x.LastName, Mobile=x.Mobile,
          Message=x.Message, IsRead=x.IsRead, AdminNote=x.AdminNote, ReadAt=x.ReadAt, CreatedAt=x.CreatedAt }).ToListAsync(ct);
    }
}

public class PortalContactMessageUpdateCommandHandler : IRequestHandler<PortalContactMessageUpdateCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;
    public PortalContactMessageUpdateCommandHandler(IApplicationDbContext db) => _db = db;
    public async Task<PortalMutationResult> Handle(PortalContactMessageUpdateCommand request, CancellationToken ct)
    {
        var row = await _db.PortalContactMessages.FirstOrDefaultAsync(x => x.PortalContactMessageId == request.PortalContactMessageId, ct)
            ?? throw new KeyNotFoundException("پیام یافت نشد");
        row.IsRead = request.IsRead; row.ReadAt = request.IsRead ? DateTime.UtcNow : null; row.AdminNote = request.AdminNote?.Trim();
        await _db.SaveChangesAsync(ct); return new PortalMutationResult { Id = row.PortalContactMessageId };
    }
}

public class PortalContactMessageDeleteCommandHandler : IRequestHandler<PortalContactMessageDeleteCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;
    public PortalContactMessageDeleteCommandHandler(IApplicationDbContext db) => _db = db;
    public async Task<PortalMutationResult> Handle(PortalContactMessageDeleteCommand request, CancellationToken ct)
    {
        var row = await _db.PortalContactMessages.FirstOrDefaultAsync(x => x.PortalContactMessageId == request.PortalContactMessageId, ct)
            ?? throw new KeyNotFoundException("پیام یافت نشد");
        _db.PortalContactMessages.Remove(row); await _db.SaveChangesAsync(ct); return new PortalMutationResult { Id = row.PortalContactMessageId };
    }
}
