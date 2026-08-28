using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Dtos;
using Healan.Domain.Portal.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.VaricoseCases;

public class VaricoseCaseDto
{
    public long VaricoseCaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid BeforeImageFileId { get; set; }
    public string BeforeImageUrl { get; set; } = string.Empty;
    public Guid AfterImageFileId { get; set; }
    public string AfterImageUrl { get; set; } = string.Empty;
    public string? TreatmentLabel { get; set; }
    public int SortOrder { get; set; }
    public bool HasPublicationConsent { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class VaricoseCaseListQuery : IRequest<List<VaricoseCaseDto>> { }
public class PublishedVaricoseCaseListQuery : IRequest<List<VaricoseCaseDto>> { }

public class VaricoseCaseSaveCommand : IRequest<PortalMutationResult>
{
    public long? VaricoseCaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid BeforeImageFileId { get; set; }
    public string? BeforeImageUrl { get; set; }
    public Guid AfterImageFileId { get; set; }
    public string? AfterImageUrl { get; set; }
    public string? TreatmentLabel { get; set; }
    public int SortOrder { get; set; }
    public bool HasPublicationConsent { get; set; }
    public bool IsPublished { get; set; }
}

public class VaricoseCaseDeleteCommand : IRequest<PortalMutationResult>
{
    public long VaricoseCaseId { get; set; }
}

public class VaricoseCaseListQueryHandler : IRequestHandler<VaricoseCaseListQuery, List<VaricoseCaseDto>>
{
    private readonly IApplicationDbContext _db;
    public VaricoseCaseListQueryHandler(IApplicationDbContext db) => _db = db;
    public Task<List<VaricoseCaseDto>> Handle(VaricoseCaseListQuery request, CancellationToken ct) =>
        Project(_db.VaricoseCases.AsNoTracking()).ToListAsync(ct);

    internal static IQueryable<VaricoseCaseDto> Project(IQueryable<VaricoseCase> query) => query
        .OrderBy(x => x.SortOrder).ThenByDescending(x => x.VaricoseCaseId)
        .Select(x => new VaricoseCaseDto
        {
            VaricoseCaseId = x.VaricoseCaseId, Title = x.Title, Description = x.Description,
            BeforeImageFileId = x.BeforeImageFileId, BeforeImageUrl = x.BeforeImageUrl,
            AfterImageFileId = x.AfterImageFileId, AfterImageUrl = x.AfterImageUrl,
            TreatmentLabel = x.TreatmentLabel, SortOrder = x.SortOrder,
            HasPublicationConsent = x.HasPublicationConsent,
            IsPublished = x.IsPublished, CreatedAt = x.CreatedAt,
        });
}

public class PublishedVaricoseCaseListQueryHandler : IRequestHandler<PublishedVaricoseCaseListQuery, List<VaricoseCaseDto>>
{
    private readonly IApplicationDbContext _db;
    public PublishedVaricoseCaseListQueryHandler(IApplicationDbContext db) => _db = db;
    public async Task<List<VaricoseCaseDto>> Handle(PublishedVaricoseCaseListQuery request, CancellationToken ct)
    {
        var items = await VaricoseCaseListQueryHandler.Project(
            _db.VaricoseCases.AsNoTracking().Where(x => x.IsPublished && x.HasPublicationConsent)).ToListAsync(ct);
        foreach (var item in items)
        {
            item.BeforeImageUrl = PortalPublicUrl.NormalizeAssetUrl(item.BeforeImageUrl) ?? string.Empty;
            item.AfterImageUrl = PortalPublicUrl.NormalizeAssetUrl(item.AfterImageUrl) ?? string.Empty;
        }
        return items;
    }
}

public class VaricoseCaseSaveCommandHandler : IRequestHandler<VaricoseCaseSaveCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _files;
    public VaricoseCaseSaveCommandHandler(IApplicationDbContext db, IFileManagerTool files) { _db = db; _files = files; }

    public async Task<PortalMutationResult> Handle(VaricoseCaseSaveCommand request, CancellationToken ct)
    {
        var title = request.Title?.Trim() ?? string.Empty;
        if (title.Length < 3) throw new ArgumentException("عنوان نمونه‌کار باید حداقل ۳ کاراکتر باشد");
        if (request.BeforeImageFileId == Guid.Empty || request.AfterImageFileId == Guid.Empty)
            throw new ArgumentException("انتخاب هر دو تصویر قبل و بعد الزامی است");
        if (request.IsPublished && !request.HasPublicationConsent)
            throw new ArgumentException("انتشار نمونه‌کار فقط پس از ثبت رضایت بیمار مجاز است");

        var row = request.VaricoseCaseId is > 0
            ? await _db.VaricoseCases.FirstOrDefaultAsync(x => x.VaricoseCaseId == request.VaricoseCaseId, ct)
            : null;
        if (request.VaricoseCaseId is > 0 && row == null) throw new KeyNotFoundException("نمونه‌کار یافت نشد");
        if (row == null) { row = new VaricoseCase(); _db.VaricoseCases.Add(row); }

        var before = await _files.GetFileReplyInfo(request.BeforeImageFileId);
        var after = await _files.GetFileReplyInfo(request.AfterImageFileId);
        row.Title = title;
        row.Description = request.Description?.Trim();
        row.BeforeImageFileId = request.BeforeImageFileId;
        row.BeforeImageUrl = PortalPublicUrl.NormalizeAssetUrl(before.Link ?? request.BeforeImageUrl)?.Trim() ?? string.Empty;
        row.AfterImageFileId = request.AfterImageFileId;
        row.AfterImageUrl = PortalPublicUrl.NormalizeAssetUrl(after.Link ?? request.AfterImageUrl)?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(row.BeforeImageUrl) || string.IsNullOrWhiteSpace(row.AfterImageUrl))
            throw new ArgumentException("دریافت لینک عمومی تصاویر ناموفق بود");
        row.TreatmentLabel = request.TreatmentLabel?.Trim();
        row.SortOrder = request.SortOrder;
        row.HasPublicationConsent = request.HasPublicationConsent;
        row.IsPublished = request.IsPublished;
        await _db.SaveChangesAsync(ct);
        return new PortalMutationResult { Id = row.VaricoseCaseId };
    }
}

public class VaricoseCaseDeleteCommandHandler : IRequestHandler<VaricoseCaseDeleteCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;
    public VaricoseCaseDeleteCommandHandler(IApplicationDbContext db) => _db = db;
    public async Task<PortalMutationResult> Handle(VaricoseCaseDeleteCommand request, CancellationToken ct)
    {
        var row = await _db.VaricoseCases.FirstOrDefaultAsync(x => x.VaricoseCaseId == request.VaricoseCaseId, ct)
            ?? throw new KeyNotFoundException("نمونه‌کار یافت نشد");
        _db.VaricoseCases.Remove(row);
        await _db.SaveChangesAsync(ct);
        return new PortalMutationResult { Id = row.VaricoseCaseId };
    }
}
