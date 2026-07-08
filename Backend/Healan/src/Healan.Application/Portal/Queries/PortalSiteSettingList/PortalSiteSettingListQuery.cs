using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.PortalSiteSettingList;

public class PortalSiteSettingListQuery : IRequest<List<PortalSiteSettingDto>>
{
}

public class PortalSiteSettingListQueryHandler : IRequestHandler<PortalSiteSettingListQuery, List<PortalSiteSettingDto>>
{
    private readonly IApplicationDbContext _db;

    public PortalSiteSettingListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<PortalSiteSettingDto>> Handle(PortalSiteSettingListQuery request, CancellationToken cancellationToken)
    {
        return await _db.PortalSiteSettings
            .AsNoTracking()
            .OrderBy(x => x.SettingGroup)
            .ThenBy(x => x.SettingKey)
            .Select(x => new PortalSiteSettingDto
            {
                PortalSiteSettingId = x.PortalSiteSettingId,
                SettingKey = x.SettingKey,
                SettingValue = x.SettingValue,
                SettingGroup = x.SettingGroup,
                Description = x.Description,
            })
            .ToListAsync(cancellationToken);
    }
}
