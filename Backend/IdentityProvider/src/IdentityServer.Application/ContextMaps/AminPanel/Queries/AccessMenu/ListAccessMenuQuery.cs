using AutoMapper;
using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Models;
namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessMenu
{

    public class ListAccessMenuQuery : AbstractRequestBase<List<AccessMenuFullResponse>>
    {
        public int AccessSystemId { get; set; }
    }
    public class ListAccessMenuQueryHandler : IRequestHandler<ListAccessMenuQuery, List<AccessMenuFullResponse>>
    {
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public ListAccessMenuQueryHandler(ApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<List<AccessMenuFullResponse>> Handle(ListAccessMenuQuery request, CancellationToken cancellationToken)
        {
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
                return [];

            IncludeAncestors(allMenus, allowedMenuIds);

            var selectedMenus = allMenus
                .Where(m => allowedMenuIds.Contains(m.AccessMenuId))
                .ToList();

            var result = BuildTree(selectedMenus);
            foreach (var item in result)
            {
                SetLevel(item, 0);
            }

            return result;
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

        private List<AccessMenuFullResponse> BuildTree(List<IdentityServer.Domain.Entities.AccessMenu> menus)
        {
            var mapped = menus
                .Select(m => _mapper.Map<AccessMenuFullResponse>(m))
                .ToDictionary(m => m.AccessMenuId);

            foreach (var item in mapped.Values)
            {
                item.Children = [];
            }

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
        private void SetLevel(AccessMenuFullResponse mainMenuResponse, int level)
        {
            if (mainMenuResponse == null)
                return;
            level++;
            mainMenuResponse.Level = level;
            if (mainMenuResponse.Children != null)
                foreach (var child in mainMenuResponse.Children)
                {
                    SetLevel(child, mainMenuResponse.Level);
                }
        }
    }
}
