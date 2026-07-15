using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;
using Share.Domain.Exceptions;

namespace IdentityServer.Application.ContextMaps.AminPanel.Commands
{
    public class SaveAccessFormCommand : IRequest<SaveAccessFormResult>
    {
        public int AccessFormId { get; set; }
        public int AccessMenuId { get; set; }
        public string FormTitle { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public int? ParentMenuId { get; set; }
        public int Order { get; set; }
        public int AccessSystemId { get; set; } = HealanAccessFormIds.SystemId;
        /// <summary>When true, creates/updates a folder menu without AccessForm.</summary>
        public bool IsFolder { get; set; }
    }

    public class SaveAccessFormResult
    {
        public int AccessFormId { get; set; }
        public int AccessMenuId { get; set; }
        public string FormTitle { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }

    public class SaveAccessFormCommandHandler : IRequestHandler<SaveAccessFormCommand, SaveAccessFormResult>
    {
        private readonly ApplicationDbContext _db;

        public SaveAccessFormCommandHandler(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<SaveAccessFormResult> Handle(SaveAccessFormCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.FormTitle))
                throw new BadRequestExceptions("عنوان الزامی است");

            var systemExists = await _db.AccessSystems
                .AnyAsync(s => s.AccessSystemId == request.AccessSystemId, cancellationToken);
            if (!systemExists)
                throw new BadRequestExceptions("سیستم دسترسی یافت نشد");

            if (request.ParentMenuId.HasValue)
            {
                var parentOk = await _db.AccessMenus
                    .AnyAsync(m => m.AccessMenuId == request.ParentMenuId.Value, cancellationToken);
                if (!parentOk)
                    throw new BadRequestExceptions("منوی والد یافت نشد");
            }

            if (request.IsFolder || string.IsNullOrWhiteSpace(request.Url))
                return await SaveFolderAsync(request, cancellationToken);

            return await SaveFormAsync(request, cancellationToken);
        }

        private async Task<SaveAccessFormResult> SaveFormAsync(SaveAccessFormCommand request, CancellationToken cancellationToken)
        {
            Domain.Entities.AccessForm form;
            Domain.Entities.AccessMenu menu;

            if (request.AccessFormId > 0)
            {
                form = await _db.AccessForms
                    .FirstOrDefaultAsync(f => f.AccessFormId == request.AccessFormId, cancellationToken)
                    ?? throw new BadRequestExceptions("فرم یافت نشد");

                form.FormTitle = request.FormTitle.Trim();
                form.URL = request.Url.Trim();
                form.AccessSystemId = request.AccessSystemId;

                menu = await _db.AccessMenus
                    .FirstOrDefaultAsync(m =>
                        m.AccessFormId == form.AccessFormId ||
                        (request.AccessMenuId > 0 && m.AccessMenuId == request.AccessMenuId), cancellationToken);

                if (menu == null)
                {
                    menu = new Domain.Entities.AccessMenu
                    {
                        AccessFormId = form.AccessFormId,
                        ParentRef = request.ParentMenuId,
                        Order = request.Order > 0 ? request.Order : await NextOrderAsync(request.ParentMenuId, cancellationToken),
                    };
                    _db.AccessMenus.Add(menu);
                }
                else
                {
                    menu.ParentRef = request.ParentMenuId;
                    if (request.Order > 0)
                        menu.Order = request.Order;
                    menu.AccessFormId = form.AccessFormId;
                }
            }
            else
            {
                form = new Domain.Entities.AccessForm
                {
                    AccessSystemId = request.AccessSystemId,
                    FormTitle = request.FormTitle.Trim(),
                    URL = request.Url.Trim(),
                };
                _db.AccessForms.Add(form);
                await _db.SaveChangesAsync(cancellationToken);

                menu = new Domain.Entities.AccessMenu
                {
                    AccessFormId = form.AccessFormId,
                    ParentRef = request.ParentMenuId,
                    Order = request.Order > 0 ? request.Order : await NextOrderAsync(request.ParentMenuId, cancellationToken),
                };
                _db.AccessMenus.Add(menu);
            }

            await _db.SaveChangesAsync(cancellationToken);

            return new SaveAccessFormResult
            {
                AccessFormId = form.AccessFormId,
                AccessMenuId = menu.AccessMenuId,
                FormTitle = form.FormTitle,
                Url = form.URL,
            };
        }

        private async Task<SaveAccessFormResult> SaveFolderAsync(SaveAccessFormCommand request, CancellationToken cancellationToken)
        {
            Domain.Entities.AccessMenu menu;
            if (request.AccessMenuId > 0)
            {
                menu = await _db.AccessMenus
                    .FirstOrDefaultAsync(m => m.AccessMenuId == request.AccessMenuId, cancellationToken)
                    ?? throw new BadRequestExceptions("منو یافت نشد");

                if (menu.AccessFormId != null)
                {
                    var form = await _db.AccessForms.FirstOrDefaultAsync(f => f.AccessFormId == menu.AccessFormId, cancellationToken);
                    if (form != null)
                        form.FormTitle = request.FormTitle.Trim();
                }

                menu.ParentRef = request.ParentMenuId;
                if (request.Order > 0)
                    menu.Order = request.Order;
            }
            else
            {
                // Folder menus need a title carrier — create a form with empty URL as display title source
                var form = new Domain.Entities.AccessForm
                {
                    AccessSystemId = request.AccessSystemId,
                    FormTitle = request.FormTitle.Trim(),
                    URL = string.Empty,
                };
                _db.AccessForms.Add(form);
                await _db.SaveChangesAsync(cancellationToken);

                menu = new Domain.Entities.AccessMenu
                {
                    AccessFormId = form.AccessFormId,
                    ParentRef = request.ParentMenuId,
                    Order = request.Order > 0 ? request.Order : await NextOrderAsync(request.ParentMenuId, cancellationToken),
                };
                _db.AccessMenus.Add(menu);
            }

            await _db.SaveChangesAsync(cancellationToken);

            return new SaveAccessFormResult
            {
                AccessFormId = menu.AccessFormId ?? 0,
                AccessMenuId = menu.AccessMenuId,
                FormTitle = request.FormTitle.Trim(),
                Url = string.Empty,
            };
        }

        private async Task<int> NextOrderAsync(int? parentMenuId, CancellationToken cancellationToken)
        {
            var q = _db.AccessMenus.AsQueryable();
            q = parentMenuId.HasValue
                ? q.Where(m => m.ParentRef == parentMenuId)
                : q.Where(m => m.ParentRef == null);
            var max = await q.Select(m => (int?)m.Order).MaxAsync(cancellationToken);
            return (max ?? 0) + 1;
        }
    }
}
