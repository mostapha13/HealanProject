using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessForm;
using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Models;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessMenu
{
    public class ListAccessMenuQuery : AbstractRequestBase<List<AccessMenuFullResponse>>
    {
        public int AccessSystemId { get; set; }
    }

    public class ListAccessMenuQueryHandler : IRequestHandler<ListAccessMenuQuery, List<AccessMenuFullResponse>>
    {
        private static readonly Dictionary<int, string> FolderTitles = new()
        {
            [5102] = "مدیریت کلینیک",
            [5108] = "اطلاعات پایه",
            [5113] = "مدیریت کاربران",
            [5120] = "محتوای سایت",
            [5133] = "نوبت‌دهی",
            [5136] = "ناحیه بیمار (سایت)",
            [5143] = "مدیریت پیامک",
            [5144] = "گزارش‌ها",
        };

        private readonly ApplicationDbContext _applicationDbContext;
        private readonly ILogger<ListAccessMenuQueryHandler> _logger;

        public ListAccessMenuQueryHandler(
            ApplicationDbContext applicationDbContext,
            ILogger<ListAccessMenuQueryHandler> logger)
        {
            _applicationDbContext = applicationDbContext;
            _logger = logger;
        }

        public async Task<List<AccessMenuFullResponse>> Handle(
            ListAccessMenuQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Projection only — avoid AutoMapper on EF graph (Parent/Children fix-up → stack overflow / 500)
                var flat = await _applicationDbContext.AccessMenus
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

                var allowedMenuIds = flat
                    .Where(m =>
                        m.FormSystemId == request.AccessSystemId
                        || (!string.IsNullOrWhiteSpace(m.Title) && m.FormId == null))
                    .Select(m => m.AccessMenuId)
                    .ToHashSet();

                if (allowedMenuIds.Count == 0)
                    return [];

                IncludeAncestors(flat.Select(m => (m.AccessMenuId, m.ParentRef)).ToList(), allowedMenuIds);

                var selected = flat
                    .Where(m => allowedMenuIds.Contains(m.AccessMenuId))
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
                                FormTitle = m.FormTitle
                                    ?? m.Title
                                    ?? FolderTitles.GetValueOrDefault(m.AccessMenuId)
                                    ?? string.Empty,
                                URL = m.FormUrl ?? string.Empty,
                            }
                            : !string.IsNullOrWhiteSpace(m.Title)
                                ? new AccessFormResponse
                                {
                                    AccessFormId = 0,
                                    FormTitle = m.Title!,
                                    URL = string.Empty,
                                }
                                : null,
                    })
                    .ToList();

                var result = BuildTree(selected);
                foreach (var item in result)
                    SetLevel(item, 0);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "ListAccessMenuQuery failed. AccessSystemId={AccessSystemId}",
                    request.AccessSystemId);
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

        private static void SetLevel(AccessMenuFullResponse menu, int level)
        {
            if (menu == null)
                return;

            level++;
            menu.Level = level;
            if (menu.Children == null)
                return;

            foreach (var child in menu.Children)
                SetLevel(child, menu.Level);
        }
    }
}
