using IdentityServer.Domain.Data;
using MediatR;
using Share.Application.Common.Models;
using Microsoft.EntityFrameworkCore;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.Role
{

    public class RoleQuery : AbstractRequestBase<List<RoleResponse>>
    {
        public int AccessSystemId { get; set; }
        public string SearchText { get; set; }
    }
    public class RoleQueryHandler : IRequestHandler<RoleQuery, List<RoleResponse>>
    {
        private readonly ApplicationDbContext _applicationDbContext;
        public RoleQueryHandler(ApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }
        public async Task<List<RoleResponse>> Handle(RoleQuery request, CancellationToken cancellationToken)
        {
            var query = from accessSystemRole in _applicationDbContext.AccessSystemRoles.AsNoTracking()
                        join role in _applicationDbContext.Roles.AsNoTracking() on accessSystemRole.RoleId equals role.Id
                        where accessSystemRole.AccessSystemId == request.AccessSystemId
                        select role;

            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                var search = request.SearchText.Trim();
                query = query.Where(r =>
                    r.Name.Contains(search) ||
                    (!string.IsNullOrEmpty(r.DisplayName) && r.DisplayName.Contains(search)));
            }

            return await query
                .OrderBy(r => r.DisplayName ?? r.Name)
                .Select(r => new RoleResponse
                {
                    RoleId = r.Id,
                    RoleName = r.Name,
                    RoleTitle = r.DisplayName ?? r.Name,
                })
                .ToListAsync(cancellationToken);
        }

    }
}
