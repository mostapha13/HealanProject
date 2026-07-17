using AutoMapper;
using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessUserRole
{

    public class ListAccessUserRoleQuery : IRequest<List<AccessUserRoleResponse>>
    {
        public int AccessSystemId { get; set; }
        public Guid IdentityId { get; set; }
    }
    public class ListAccessUserRoleQueryHandler : IRequestHandler<ListAccessUserRoleQuery, List<AccessUserRoleResponse>>
    {
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<ListAccessUserRoleQueryHandler> _logger;
        public ListAccessUserRoleQueryHandler(ApplicationDbContext applicationDbContext, IMapper mapper, IHttpContextAccessor httpContextAccessor, ILogger<ListAccessUserRoleQueryHandler> logger)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }
        public async Task<List<AccessUserRoleResponse>> Handle(ListAccessUserRoleQuery request, CancellationToken cancellationToken)
        {

            Guid userId = request.IdentityId;
            _logger.LogInformation($"ABC Identity User Id {_httpContextAccessor.HttpContext?.User?.FindFirstValue("sub")}");
            //if (!Guid.TryParse(_httpContextAccessor.HttpContext?.User?.FindFirstValue("sub"), out userId))
            //return null;

            var userRoles = _applicationDbContext.UserRoles.Where(x => x.UserId == userId).Select(s => s.RoleId).ToList();

            var isAdmin = (
                from ur in _applicationDbContext.UserRoles
                join role in _applicationDbContext.Roles on ur.RoleId equals role.Id
                where ur.UserId == userId && role.Name == ConstUserInfo.AdminRole
                select ur.RoleId
            ).Any();

            var result = (from m in _applicationDbContext.AccessForms
                          join r in _applicationDbContext.AccessMenus on m.AccessFormId equals r.AccessFormId
                          join ar in _applicationDbContext.AccessRoles.Where(w => userRoles.Contains(w.RoleId)) on r.AccessMenuId equals ar.AccessMenuId into accessRoles
                          from myAccessRole in accessRoles.DefaultIfEmpty()
                          where m.AccessSystemId == request.AccessSystemId
                          && m.URL != null
                          select new
                          {
                              m.AccessSystemId,
                              HasAccess = isAdmin || myAccessRole != null,
                              HasPersianAccess = isAdmin ? true : (myAccessRole == null ? null : myAccessRole.HasPersianAccess),
                              m.FormTitle,
                              m.URL
                          }).GroupBy(g => new { g.AccessSystemId, g.URL, g.FormTitle, g.HasAccess, g.HasPersianAccess }).Select(s => new AccessUserRoleResponse { AccessSystemId = s.Key.AccessSystemId, FormTitle = s.Key.FormTitle, HasAccess = s.Key.HasAccess, URL = s.Key.URL, HasPersianAccess = s.Key.HasPersianAccess }).ToList();
            foreach (var item in result)
            {
                if (string.IsNullOrEmpty(item.URL) && !item.URL.Contains(@"/"))
                {
                    item.PageUrl = item.URL;
                    continue;
                }
                var urls = item.URL.Split('/');
                item.PageUrl = urls[urls.Length - 1];
            }

            return result;
        }

    }
}
