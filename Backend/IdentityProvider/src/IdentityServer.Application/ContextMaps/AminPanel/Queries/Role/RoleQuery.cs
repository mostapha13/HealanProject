using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using MediatR;
using Share.Application.Common.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.Role
{

    public class RoleQuery : AbstractRequestBase<List<RoleResponse>>
    {
        public int AccessSystemId { get; set; }
        public string? SearchText { get; set; }
    }
    public class RoleQueryHandler : IRequestHandler<RoleQuery, List<RoleResponse>>
    {
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly ILogger<RoleQueryHandler> _logger;

        public RoleQueryHandler(ApplicationDbContext applicationDbContext, ILogger<RoleQueryHandler> logger)
        {
            _applicationDbContext = applicationDbContext;
            _logger = logger;
        }

        public async Task<List<RoleResponse>> Handle(RoleQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var roleIds = await _applicationDbContext.AccessSystemRoles
                    .AsNoTracking()
                    .Where(x => x.AccessSystemId == request.AccessSystemId)
                    .Select(x => x.RoleId)
                    .ToListAsync(cancellationToken);

                if (roleIds.Count == 0)
                    return new List<RoleResponse>();

                var roles = await _applicationDbContext.Roles
                    .AsNoTracking()
                    .Where(r => roleIds.Contains(r.Id))
                    .ToListAsync(cancellationToken);

                IEnumerable<ApplicationRole> filtered = roles;
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim();
                    filtered = roles.Where(r =>
                        (!string.IsNullOrEmpty(r.Name) && r.Name.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                        (!string.IsNullOrEmpty(r.DisplayName) && r.DisplayName.Contains(search, StringComparison.OrdinalIgnoreCase)));
                }

                return filtered
                    .OrderBy(r => r.DisplayName ?? r.Name ?? string.Empty)
                    .Select(r => new RoleResponse
                    {
                        RoleId = r.Id,
                        RoleName = r.Name ?? string.Empty,
                        RoleTitle = r.DisplayName ?? r.Name ?? string.Empty,
                    })
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "RoleQuery failed. AccessSystemId={AccessSystemId}, SearchText={SearchText}",
                    request.AccessSystemId,
                    request.SearchText);
                throw;
            }
        }

    }
}
