using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessForm;
using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Models;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessRole
{
    public class ListAccessRoleQuery : AbstractRequestBase<AccessRoleFullResponse>
    {
        public int AccessSystemId { get; set; }
        public Guid? RoleId { get; set; }
    }

    public class ListAccessRoleQueryHandler : IRequestHandler<ListAccessRoleQuery, AccessRoleFullResponse>
    {
        private static readonly Dictionary<int, string> FolderTitles = new()
        {
            [5102] = "مدیریت کلینیک",
            [5108] = "اطلاعات پایه",
            [5113] = "مدیریت کاربران",
            [5120] = "محتوای سایت",
            [5133] = "نوبت‌دهی",
        };

        private readonly ApplicationDbContext _applicationDbContext;
        private readonly ILogger<ListAccessRoleQueryHandler> _logger;

        public ListAccessRoleQueryHandler(
            ApplicationDbContext applicationDbContext,
            ILogger<ListAccessRoleQueryHandler> logger)
        {
            _applicationDbContext = applicationDbContext;
            _logger = logger;
        }

        public async Task<AccessRoleFullResponse> Handle(
            ListAccessRoleQuery request,
            CancellationToken cancellationToken)
        {
            if (!request.RoleId.HasValue)
                return null!;

            try
            {
                var flat = await _applicationDbContext.AccessMenus
                    .AsNoTracking()
                    .Select(m => new
                    {
                        m.AccessMenuId,
                        m.AccessFormId,
                        m.ParentRef,
                        m.Order,
                        FormId = m.AccessForm != null ? m.AccessForm.AccessFormId : (int?)null,
                        FormTitle = m.AccessForm != null ? m.AccessForm.FormTitle : null,
                        FormUrl = m.AccessForm != null ? m.AccessForm.URL : null,
                        FormSystemId = m.AccessForm != null ? m.AccessForm.AccessSystemId : (int?)null,
                    })
                    .OrderBy(o => o.Order)
                    .ToListAsync(cancellationToken);

                var allowedMenuIds = flat
                    .Where(m => m.FormSystemId == request.AccessSystemId)
                    .Select(m => m.AccessMenuId)
                    .ToHashSet();

                if (allowedMenuIds.Count == 0)
                {
                    return new AccessRoleFullResponse
                    {
                        RoleId = request.RoleId.Value,
                        Items = [],
                    };
                }

                IncludeAncestors(flat.Select(m => (m.AccessMenuId, m.ParentRef)).ToList(), allowedMenuIds);

                var selected = flat
                    .Where(m => allowedMenuIds.Contains(m.AccessMenuId))
                    .Select(m => new AccessRoleFullResponseItem
                    {
                        AccessMenuId = m.AccessMenuId,
                        AccessFormId = m.AccessFormId,
                        ParentRef = m.ParentRef,
                        Order = m.Order,
                        Level = 0,
                        Children = new List<AccessRoleFullResponseItem>(),
                        AccessForm = m.FormId.HasValue
                            ? new AccessFormResponse
                            {
                                AccessFormId = m.FormId.Value,
                                FormTitle = m.FormTitle
                                    ?? FolderTitles.GetValueOrDefault(m.AccessMenuId)
                                    ?? string.Empty,
                                URL = m.FormUrl ?? string.Empty,
                            }
                            : null,
                    })
                    .ToList();

                var result = BuildTree(selected);

                var allAccessRole = await _applicationDbContext.AccessRoles
                    .AsNoTracking()
                    .Where(w => w.RoleId == request.RoleId)
                    .ToListAsync(cancellationToken);

                var accessByMenuId = allAccessRole
                    .GroupBy(a => a.AccessMenuId)
                    .ToDictionary(g => g.Key, g => g.First());

                foreach (var item in result)
                {
                    SetLevel(accessByMenuId, item, 0);
                    FixAccess(item);
                }

                return new AccessRoleFullResponse
                {
                    RoleId = request.RoleId.Value,
                    Items = result,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "ListAccessRoleQuery failed. AccessSystemId={AccessSystemId}, RoleId={RoleId}",
                    request.AccessSystemId,
                    request.RoleId);
                throw;
            }
        }

        private static void IncludeAncestors(
            List<(int AccessMenuId, int? ParentRef)> menus,
            HashSet<int> selectedIds)
        {
            var menuById = menus.ToDictionary(m => m.AccessMenuId, m => m.ParentRef);
            var queue = new Queue<int>(selectedIds);

            while (queue.Count > 0)
            {
                var menuId = queue.Dequeue();
                if (!menuById.TryGetValue(menuId, out var parentRef) || !parentRef.HasValue)
                    continue;

                var parentId = parentRef.Value;
                if (selectedIds.Add(parentId))
                    queue.Enqueue(parentId);
            }
        }

        private static List<AccessRoleFullResponseItem> BuildTree(List<AccessRoleFullResponseItem> menus)
        {
            var mapped = menus.ToDictionary(m => m.AccessMenuId);
            foreach (var item in mapped.Values)
                item.Children = new List<AccessRoleFullResponseItem>();

            var roots = new List<AccessRoleFullResponseItem>();
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

        private static void SetLevel(
            Dictionary<int, IdentityServer.Domain.Entities.AccessRole> accessByMenuId,
            AccessRoleFullResponseItem menu,
            int level)
        {
            if (menu == null)
                return;

            level++;
            menu.Level = level;
            menu.HasAccess = accessByMenuId.ContainsKey(menu.AccessMenuId);
            menu.HasPersianAccess = accessByMenuId.TryGetValue(menu.AccessMenuId, out var access)
                ? access.HasPersianAccess
                : null;
            menu.Title = menu.AccessForm?.FormTitle
                ?? FolderTitles.GetValueOrDefault(menu.AccessMenuId)
                ?? string.Empty;

            if (menu.Children == null)
                return;

            foreach (var child in menu.Children)
                SetLevel(accessByMenuId, child, menu.Level);
        }

        private static void FixAccess(AccessRoleFullResponseItem menu)
        {
            if (menu?.Children == null)
                return;

            foreach (var child in menu.Children)
                FixAccess(child);

            if (menu.Children.Count > 0 && !menu.AccessFormId.HasValue)
                menu.HasAccess = menu.Children.All(w => w.HasAccess);
        }
    }
}
