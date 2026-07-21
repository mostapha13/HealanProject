using AutoMapper;
using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Domain.Constants;
using Share.Domain.Exceptions;
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
            var principal = _httpContextAccessor.HttpContext?.User;
            if (principal?.Identity?.IsAuthenticated != true ||
                !Guid.TryParse(principal.FindFirstValue("sub"), out var callerId) ||
                callerId == Guid.Empty)
            {
                throw new UnauthorizedAccessException("Authenticated user identity is missing.");
            }

            var userId = request.IdentityId == Guid.Empty ? callerId : request.IdentityId;
            if (userId != callerId && !await CanManageHealanAccessAsync(callerId, cancellationToken))
            {
                _logger.LogWarning(
                    "User {CallerId} attempted to read access for {TargetUserId}.",
                    callerId,
                    userId);
                throw new ForbiddenAccessExceptions();
            }

            var userRoles = await _applicationDbContext.UserRoles
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Join(
                    _applicationDbContext.Roles.Where(r => !r.IsDeleted),
                    ur => ur.RoleId,
                    role => role.Id,
                    (ur, role) => ur.RoleId)
                .ToListAsync(cancellationToken);

            var isAdmin = await (
                from ur in _applicationDbContext.UserRoles
                join role in _applicationDbContext.Roles on ur.RoleId equals role.Id
                where ur.UserId == userId && role.Name == ConstUserInfo.AdminRole && !role.IsDeleted
                select ur.RoleId
            ).AnyAsync(cancellationToken);

            var roleGrants = await _applicationDbContext.AccessRoles
                .AsNoTracking()
                .Where(x => userRoles.Contains(x.RoleId))
                .Select(x => new { x.AccessMenuId, x.HasPersianAccess })
                .ToListAsync(cancellationToken);
            var directMenuIds = await _applicationDbContext.AccessUserGrants
                .AsNoTracking()
                .Where(x => x.UserId == userId
                    && x.AccessSystemId == request.AccessSystemId
                    && !x.IsDeleted)
                .Select(x => x.AccessMenuId)
                .ToListAsync(cancellationToken);

            var roleGrantByMenu = roleGrants
                .GroupBy(x => x.AccessMenuId)
                .ToDictionary(
                    x => x.Key,
                    x => x.Any(v => v.HasPersianAccess == true)
                        ? true
                        : x.Any(v => v.HasPersianAccess == false)
                            ? false
                            : (bool?)null);
            var directGrantSet = directMenuIds.ToHashSet();
            var forms = await (
                from form in _applicationDbContext.AccessForms.AsNoTracking()
                join menu in _applicationDbContext.AccessMenus.AsNoTracking()
                    on form.AccessFormId equals menu.AccessFormId
                where form.AccessSystemId == request.AccessSystemId && form.URL != null
                select new { form.AccessSystemId, form.FormTitle, form.URL, menu.AccessMenuId })
                .ToListAsync(cancellationToken);

            var result = forms
                .GroupBy(x => new { x.AccessSystemId, x.FormTitle, x.URL })
                .Select(group =>
                {
                    var roleValues = group
                        .Where(x => roleGrantByMenu.ContainsKey(x.AccessMenuId))
                        .Select(x => roleGrantByMenu[x.AccessMenuId])
                        .ToList();
                    var hasDirectGrant = group.Any(x => directGrantSet.Contains(x.AccessMenuId));
                    return new AccessUserRoleResponse
                    {
                        AccessSystemId = group.Key.AccessSystemId,
                        FormTitle = group.Key.FormTitle,
                        URL = group.Key.URL,
                        HasAccess = isAdmin || hasDirectGrant || roleValues.Count > 0,
                        HasPersianAccess = isAdmin || hasDirectGrant
                            ? true
                            : roleValues.Any(x => x == true)
                                ? true
                                : roleValues.Any(x => x == false)
                                    ? false
                                    : null,
                    };
                })
                .ToList();
            foreach (var item in result)
            {
                if (string.IsNullOrEmpty(item.URL) || !item.URL.Contains('/'))
                {
                    item.PageUrl = item.URL;
                    continue;
                }
                var urls = item.URL.Split('/');
                item.PageUrl = urls[urls.Length - 1];
            }

            return result;
        }

        private async Task<bool> CanManageHealanAccessAsync(Guid callerId, CancellationToken cancellationToken)
        {
            var isAdmin = await (
                from ur in _applicationDbContext.UserRoles
                join role in _applicationDbContext.Roles on ur.RoleId equals role.Id
                where ur.UserId == callerId && role.Name == ConstUserInfo.AdminRole && !role.IsDeleted
                select ur.RoleId
            ).AnyAsync(cancellationToken);

            if (isAdmin)
                return true;

            var hasRoleGrant = await (
                from ur in _applicationDbContext.UserRoles
                join role in _applicationDbContext.Roles on ur.RoleId equals role.Id
                join accessRole in _applicationDbContext.AccessRoles on ur.RoleId equals accessRole.RoleId
                join menu in _applicationDbContext.AccessMenus on accessRole.AccessMenuId equals menu.AccessMenuId
                join form in _applicationDbContext.AccessForms on menu.AccessFormId equals form.AccessFormId
                where ur.UserId == callerId
                    && !role.IsDeleted
                    && form.AccessSystemId == HealanAccessFormIds.SystemId
                    && form.AccessFormId == HealanAccessFormIds.AccessAdmin
                select accessRole.AccessRoleId
            ).AnyAsync(cancellationToken);

            if (hasRoleGrant)
                return true;

            return await (
                from grant in _applicationDbContext.AccessUserGrants
                join menu in _applicationDbContext.AccessMenus on grant.AccessMenuId equals menu.AccessMenuId
                where grant.UserId == callerId
                    && grant.AccessSystemId == HealanAccessFormIds.SystemId
                    && !grant.IsDeleted
                    && menu.AccessFormId == HealanAccessFormIds.AccessAdmin
                select grant.AccessUserGrantId
            ).AnyAsync(cancellationToken);
        }

    }
}
