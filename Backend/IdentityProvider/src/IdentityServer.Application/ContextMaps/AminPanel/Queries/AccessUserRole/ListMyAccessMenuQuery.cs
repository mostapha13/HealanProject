using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessForm;
using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessMenu;
using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;
using System.Security.Claims;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessUserRole;

public sealed class ListMyAccessMenuQuery : IRequest<List<AccessMenuFullResponse>>
{
    public int AccessSystemId { get; set; } = HealanAccessFormIds.SystemId;
}

public sealed class ListMyAccessMenuQueryHandler
    : IRequestHandler<ListMyAccessMenuQuery, List<AccessMenuFullResponse>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ListMyAccessMenuQueryHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<List<AccessMenuFullResponse>> Handle(
        ListMyAccessMenuQuery request,
        CancellationToken cancellationToken)
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true ||
            !Guid.TryParse(principal.FindFirstValue("sub"), out var userId) ||
            userId == Guid.Empty)
        {
            throw new UnauthorizedAccessException("Authenticated user identity is missing.");
        }

        var isAdmin = await (
            from ur in _db.UserRoles
            join role in _db.Roles on ur.RoleId equals role.Id
            where ur.UserId == userId && role.Name == ConstUserInfo.AdminRole && !role.IsDeleted
            select ur.RoleId
        ).AnyAsync(cancellationToken);

        var roleMenuIds = await (
            from ur in _db.UserRoles
            join role in _db.Roles on ur.RoleId equals role.Id
            join accessRole in _db.AccessRoles on ur.RoleId equals accessRole.RoleId
            where ur.UserId == userId && !role.IsDeleted
            select accessRole.AccessMenuId
        ).Distinct().ToListAsync(cancellationToken);

        var directMenuIds = await _db.AccessUserGrants
            .AsNoTracking()
            .Where(x => x.UserId == userId
                && x.AccessSystemId == request.AccessSystemId
                && !x.IsDeleted)
            .Select(x => x.AccessMenuId)
            .ToListAsync(cancellationToken);

        var grantedLeafIds = roleMenuIds.Concat(directMenuIds).ToHashSet();

        var flat = await _db.AccessMenus
            .AsNoTracking()
            .Select(m => new
            {
                m.AccessMenuId,
                m.AccessFormId,
                m.ParentRef,
                m.Order,
                m.Title,
                m.IsActive,
                FormId = m.AccessForm != null ? m.AccessForm.AccessFormId : (int?)null,
                FormTitle = m.AccessForm != null ? m.AccessForm.FormTitle : null,
                FormUrl = m.AccessForm != null ? m.AccessForm.URL : null,
                FormSystemId = m.AccessForm != null ? m.AccessForm.AccessSystemId : (int?)null,
            })
            .OrderBy(o => o.Order)
            .ToListAsync(cancellationToken);

        var healanMenuIds = flat
            .Where(m =>
                m.FormSystemId == request.AccessSystemId
                || (m.FormId == null && !string.IsNullOrWhiteSpace(m.Title))
                || (m.FormId != null && string.IsNullOrEmpty(m.FormUrl) && m.FormSystemId == request.AccessSystemId))
            .Select(m => m.AccessMenuId)
            .ToHashSet();

        // Folders without forms still need to be selectable as ancestors
        foreach (var item in flat.Where(m => m.FormId == null || string.IsNullOrEmpty(m.FormUrl)))
            healanMenuIds.Add(item.AccessMenuId);

        HashSet<int> selectedIds;
        if (isAdmin)
        {
            selectedIds = flat
                .Where(m => m.IsActive && healanMenuIds.Contains(m.AccessMenuId))
                .Select(m => m.AccessMenuId)
                .ToHashSet();
        }
        else
        {
            selectedIds = grantedLeafIds
                .Where(id => flat.Any(m => m.AccessMenuId == id && m.IsActive))
                .ToHashSet();
            IncludeAncestors(flat.Select(m => (m.AccessMenuId, m.ParentRef, m.IsActive)).ToList(), selectedIds);
            selectedIds.RemoveWhere(id =>
            {
                var row = flat.FirstOrDefault(m => m.AccessMenuId == id);
                return row == null || !row.IsActive;
            });
        }

        if (selectedIds.Count == 0)
            return [];

        var selected = flat
            .Where(m => selectedIds.Contains(m.AccessMenuId))
            .Select(m => new AccessMenuFullResponse
            {
                AccessMenuId = m.AccessMenuId,
                AccessFormId = m.AccessFormId,
                ParentRef = m.ParentRef,
                Order = m.Order,
                Title = m.Title,
                IsActive = m.IsActive,
                Level = 0,
                Children = new List<AccessMenuFullResponse>(),
                AccessForm = m.FormId.HasValue
                    ? new AccessFormResponse
                    {
                        AccessFormId = m.FormId.Value,
                        FormTitle = m.FormTitle ?? m.Title ?? string.Empty,
                        URL = m.FormUrl ?? string.Empty,
                    }
                    : m.Title != null
                        ? new AccessFormResponse
                        {
                            AccessFormId = 0,
                            FormTitle = m.Title,
                            URL = string.Empty,
                        }
                        : null,
            })
            .ToList();

        return BuildTree(selected);
    }

    private static void IncludeAncestors(
        List<(int AccessMenuId, int? ParentRef, bool IsActive)> menus,
        HashSet<int> selectedIds)
    {
        var menuById = menus.ToDictionary(m => m.AccessMenuId, m => m);
        var queue = new Queue<int>(selectedIds);
        while (queue.Count > 0)
        {
            var menuId = queue.Dequeue();
            if (!menuById.TryGetValue(menuId, out var row) || !row.ParentRef.HasValue)
                continue;
            var parentId = row.ParentRef.Value;
            if (selectedIds.Add(parentId))
                queue.Enqueue(parentId);
        }
    }

    private static List<AccessMenuFullResponse> BuildTree(List<AccessMenuFullResponse> menus)
    {
        var mapped = menus.ToDictionary(m => m.AccessMenuId);
        foreach (var item in mapped.Values)
            item.Children = new List<AccessMenuFullResponse>();

        var roots = new List<AccessMenuFullResponse>();
        foreach (var item in mapped.Values.OrderBy(i => i.Order))
        {
            if (item.ParentRef.HasValue && mapped.TryGetValue(item.ParentRef.Value, out var parent))
            {
                parent.Children.Add(item);
                continue;
            }
            roots.Add(item);
        }

        return roots.OrderBy(r => r.Order).ToList();
    }
}
