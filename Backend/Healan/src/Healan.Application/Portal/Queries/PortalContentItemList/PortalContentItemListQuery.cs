using Healan.Application.Portal;
using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Enums;
using FileManager.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.PortalContentItemList;

public class PortalContentItemListQuery : IRequest<List<PortalContentItemDto>>
{
    public PortalSectionType? SectionType { get; set; }
    public bool? IsPublished { get; set; }
}

public class PortalContentItemListQueryHandler : IRequestHandler<PortalContentItemListQuery, List<PortalContentItemDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _fileManagerTool;

    public PortalContentItemListQueryHandler(IApplicationDbContext db, IFileManagerTool fileManagerTool)
    {
        _db = db;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<List<PortalContentItemDto>> Handle(PortalContentItemListQuery request, CancellationToken cancellationToken)
    {
        var query = _db.PortalContentItems.AsNoTracking().AsQueryable();

        if (request.SectionType.HasValue)
            query = query.Where(x => x.SectionType == request.SectionType.Value);

        if (request.IsPublished.HasValue)
            query = query.Where(x => x.IsPublished == request.IsPublished.Value);

        var items = await query
            .OrderBy(x => x.SectionType)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.PortalContentItemId)
            .Select(x => new PortalContentItemDto
            {
                PortalContentItemId = x.PortalContentItemId,
                SectionType = x.SectionType,
                Title = x.Title,
                Subtitle = x.Subtitle,
                Body = x.Body,
                ImageUrl = x.ImageUrl,
                ImageFileId = x.ImageFileId,
                IconName = x.IconName,
                LinkUrl = x.LinkUrl,
                Color = x.Color,
                SortOrder = x.SortOrder,
                IsPublished = x.IsPublished,
            })
            .ToListAsync(cancellationToken);

        await PortalContentImageResolver.ApplyFileLinksAsync(items, _fileManagerTool, cancellationToken);
        return items;
    }
}
