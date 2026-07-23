using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.PortalSeoPageList;

public class PortalSeoPageListQuery : IRequest<List<PortalSeoPageDto>>
{
}

public class PortalSeoPageListQueryHandler : IRequestHandler<PortalSeoPageListQuery, List<PortalSeoPageDto>>
{
    private readonly IApplicationDbContext _db;

    public PortalSeoPageListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<PortalSeoPageDto>> Handle(PortalSeoPageListQuery request, CancellationToken cancellationToken)
    {
        return await _db.PortalSeoPages.AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Path)
            .Select(x => new PortalSeoPageDto
            {
                PortalSeoPageId = x.PortalSeoPageId,
                PageKey = x.PageKey,
                Path = x.Path,
                Title = x.Title,
                Description = x.Description,
                Keywords = x.Keywords,
                OgTitle = x.OgTitle,
                OgDescription = x.OgDescription,
                OgImageUrl = x.OgImageUrl,
                OgImageFileId = x.OgImageFileId,
                CanonicalUrl = x.CanonicalUrl,
                Robots = x.Robots,
                JsonLdExtra = x.JsonLdExtra,
                IsActive = x.IsActive,
                SortOrder = x.SortOrder,
            })
            .ToListAsync(cancellationToken);
    }
}
