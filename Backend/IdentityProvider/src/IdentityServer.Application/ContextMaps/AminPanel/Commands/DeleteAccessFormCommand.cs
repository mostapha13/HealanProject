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
            Enumerable.Range(5101, 44).ToHashSet(); // 5101..5144 seeded Healan menus

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

            if (ProtectedMenuIds.Contains(menu.AccessMenuId)
                || (menu.AccessFormId.HasValue && ProtectedFormIds.Contains(menu.AccessFormId.Value)))
            {
                // Soft-disable system menus instead of hard delete
                menu.IsActive = false;
                await _db.SaveChangesAsync(cancellationToken);
                return true;
            }

            if (menu.Children != null && menu.Children.Any(c => c.IsActive))
                throw new BadRequestExceptions("ابتدا زیرمنوها را حذف یا غیرفعال کنید");

            // Soft-delete custom menus by default
            menu.IsActive = false;
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
