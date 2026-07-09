using AutoMapper;
using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
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
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public ListAccessRoleQueryHandler(ApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<AccessRoleFullResponse> Handle(ListAccessRoleQuery request, CancellationToken cancellationToken)
        {
            if (!request.RoleId.HasValue)
                return null;

            var allMenus = await _applicationDbContext.AccessMenus
                .Include(a => a.AccessForm)
                .AsNoTracking()
                .OrderBy(o => o.Order)
                .ToListAsync(cancellationToken);

            var allowedMenuIds = allMenus
                .Where(m => m.AccessForm != null && m.AccessForm.AccessSystemId == request.AccessSystemId)
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

            IncludeAncestors(allMenus, allowedMenuIds);
            var selectedMenus = allMenus.Where(m => allowedMenuIds.Contains(m.AccessMenuId)).ToList();
            var result = BuildTree(selectedMenus);

            var allAccessRole = await _applicationDbContext.AccessRoles
                .AsNoTracking()
                .Where(w => w.RoleId == request.RoleId)
                .ToListAsync(cancellationToken);

            var accessByMenuId = allAccessRole.ToDictionary(a => a.AccessMenuId, a => a);
            foreach (var item in result)
            {
                SetLevel(accessByMenuId, item, 0);
                FixAccess(item);
            }

            AccessRoleFullResponse accessRoleFullResponse = new AccessRoleFullResponse();
            accessRoleFullResponse.RoleId = request.RoleId.Value;
            accessRoleFullResponse.Items = result;
            return accessRoleFullResponse;
        }
        private static void IncludeAncestors(
            List<IdentityServer.Domain.Entities.AccessMenu> allMenus,
            HashSet<int> selectedIds)
        {
            var menuById = allMenus.ToDictionary(m => m.AccessMenuId);
            var queue = new Queue<int>(selectedIds);

            while (queue.Count > 0)
            {
                var menuId = queue.Dequeue();
                if (!menuById.TryGetValue(menuId, out var menu) || !menu.ParentRef.HasValue)
                    continue;

                var parentId = menu.ParentRef.Value;
                if (selectedIds.Add(parentId))
                {
                    queue.Enqueue(parentId);
                }
            }
        }

        private List<AccessRoleFullResponseItem> BuildTree(List<IdentityServer.Domain.Entities.AccessMenu> menus)
        {
            var mapped = menus
                .Select(m => _mapper.Map<AccessRoleFullResponseItem>(m))
                .ToDictionary(m => m.AccessMenuId);

            foreach (var item in mapped.Values)
            {
                item.Children = [];
            }

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

        private void SetLevel(Dictionary<int, IdentityServer.Domain.Entities.AccessRole> accessByMenuId, AccessRoleFullResponseItem mainMenuResponse, int level)
        {
            if (mainMenuResponse == null)
                return;
            level++;
            mainMenuResponse.Level = level;
            mainMenuResponse.HasAccess = accessByMenuId.ContainsKey(mainMenuResponse.AccessMenuId);
            mainMenuResponse.HasPersianAccess = accessByMenuId.TryGetValue(mainMenuResponse.AccessMenuId, out var access)
                ? access.HasPersianAccess
                : null;
            mainMenuResponse.Title = mainMenuResponse.AccessForm?.FormTitle;
            if (mainMenuResponse.Children != null)
                foreach (var child in mainMenuResponse.Children)
                {
                    SetLevel(accessByMenuId, child, mainMenuResponse.Level);
                }
        }
        private void FixAccess(AccessRoleFullResponseItem mainMenuResponse)
        {
            if (mainMenuResponse == null)
                return;

            if (mainMenuResponse.Children != null)
                foreach (var child in mainMenuResponse.Children)
                {
                    FixAccess(child);
                }

            // Container menus have no AccessForm; reflect checked state from children for tree UI only.
            if (mainMenuResponse.Children != null
                && mainMenuResponse.Children.Any()
                && !mainMenuResponse.AccessFormId.HasValue)
            {
                mainMenuResponse.HasAccess = mainMenuResponse.Children.All(w => w.HasAccess);
            }
        }
    }
}
