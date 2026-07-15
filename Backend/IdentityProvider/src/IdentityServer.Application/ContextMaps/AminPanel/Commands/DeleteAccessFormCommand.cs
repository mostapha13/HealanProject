using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;
using Share.Domain.Exceptions;

namespace IdentityServer.Application.ContextMaps.AminPanel.Commands
{
    public class DeleteAccessFormCommand : IRequest<bool>
    {
        public int AccessMenuId { get; set; }
    }

    public class DeleteAccessFormCommandHandler : IRequestHandler<DeleteAccessFormCommand, bool>
    {
        private static readonly HashSet<int> ProtectedMenuIds =
            Enumerable.Range(5101, 28).ToHashSet(); // 5101..5128 seeded Healan menus

        private static readonly HashSet<int> ProtectedFormIds =
            Enumerable.Range(HealanAccessFormIds.Dashboard, HealanAccessFormIds.PortalRag - HealanAccessFormIds.Dashboard + 1)
                .ToHashSet();

        private readonly ApplicationDbContext _db;

        public DeleteAccessFormCommandHandler(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<bool> Handle(DeleteAccessFormCommand request, CancellationToken cancellationToken)
        {
            var menu = await _db.AccessMenus
                .Include(m => m.Children)
                .FirstOrDefaultAsync(m => m.AccessMenuId == request.AccessMenuId, cancellationToken)
                ?? throw new BadRequestExceptions("منو یافت نشد");

            if (ProtectedMenuIds.Contains(menu.AccessMenuId))
                throw new BadRequestExceptions("منوهای سیستمی قابل حذف نیستند");

            if (menu.AccessFormId.HasValue && ProtectedFormIds.Contains(menu.AccessFormId.Value))
                throw new BadRequestExceptions("فرم‌های سیستمی قابل حذف نیستند");

            if (menu.Children != null && menu.Children.Any())
                throw new BadRequestExceptions("ابتدا زیرمنوها را حذف کنید");

            var hasRoleGrants = await _db.AccessRoles
                .AnyAsync(r => r.AccessMenuId == menu.AccessMenuId, cancellationToken);
            if (hasRoleGrants)
                throw new BadRequestExceptions("این منو به نقش‌ها تخصیص داده شده؛ ابتدا از سطح دسترسی حذف کنید");

            var formId = menu.AccessFormId;
            _db.AccessMenus.Remove(menu);
            await _db.SaveChangesAsync(cancellationToken);

            if (formId.HasValue)
            {
                var stillLinked = await _db.AccessMenus
                    .AnyAsync(m => m.AccessFormId == formId.Value, cancellationToken);
                if (!stillLinked)
                {
                    var form = await _db.AccessForms
                        .FirstOrDefaultAsync(f => f.AccessFormId == formId.Value, cancellationToken);
                    if (form != null)
                        _db.AccessForms.Remove(form);
                    await _db.SaveChangesAsync(cancellationToken);
                }
            }

            return true;
        }
    }
}
