using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessRole;
using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Domain.Exceptions;

namespace IdentityServer.Application.ContextMaps.AminPanel.Commands
{
    public class SaveAccessRoleCommand : IRequest<AccessRoleFullResponse>
    {
        public Guid RoleId { get; set; }
        public List<AccessRoleFullResponseItem> Items { get; set; }
    }
    public class SaveAccessRoleCommandHandler : IRequestHandler<SaveAccessRoleCommand, AccessRoleFullResponse>
    {
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IMediator _mediator;
        private readonly ILogger<SaveAccessRoleCommandHandler> _logger;
        public SaveAccessRoleCommandHandler(ApplicationDbContext applicationDbContext, IMediator mediator, ILogger<SaveAccessRoleCommandHandler> logger)
        {
            _applicationDbContext = applicationDbContext;
            _mediator = mediator;
            _logger = logger;
        }
        public async Task<AccessRoleFullResponse> Handle(SaveAccessRoleCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Start Save Request");
            var role = await _applicationDbContext.Roles.FirstOrDefaultAsync(p => p.Id == request.RoleId, cancellationToken);
            if (role == null)
            {
                throw new BadRequestExceptions("Role Not Exists");
            }

            var allSystemId = await _applicationDbContext.AccessSystemRoles
                .Where(w => w.RoleId == role.Id)
                .Select(s => s.AccessSystemId)
                .ToListAsync(cancellationToken);

            var allAccessMenuId = await (from am in _applicationDbContext.AccessMenus
                                   join af in _applicationDbContext.AccessForms on am.AccessFormId equals af.AccessFormId
                                   where allSystemId.Contains(af.AccessSystemId)
                                   select am.AccessMenuId).ToListAsync(cancellationToken);
            request.Items = request.Items.Where(w => allAccessMenuId.Contains(w.AccessMenuId)).ToList();

            List<int> allMenuIds = new List<int>();
            var requestItemByMenuId = new Dictionary<int, AccessRoleFullResponseItem>();
            foreach (var item in request.Items)
            {
                if (item.Children != null && item.Children.Any(a => a.HasAccess))
                    item.HasAccess = true;
                SetAllMenuIds(item, allMenuIds, requestItemByMenuId);
            }
            var allExistsAccessMenuId = await _applicationDbContext.AccessRoles
                .Where(w => w.RoleId == request.RoleId)
                .Select(s => s.AccessMenuId)
                .ToListAsync(cancellationToken);
            var mustInserted = allMenuIds.Except(allExistsAccessMenuId);
            var mustUpdated = allMenuIds.Intersect(allExistsAccessMenuId);
            var mustDeleted = allExistsAccessMenuId.Except(allMenuIds);
            foreach (var item in mustInserted)
            {
                requestItemByMenuId.TryGetValue(item, out var itm);
                _applicationDbContext.AccessRoles.Add(new IdentityServer.Domain.Entities.AccessRole() { AccessMenuId = item, RoleId = request.RoleId, HasPersianAccess = itm?.HasPersianAccess });
            }
            foreach (var item in mustUpdated)
            {
                var Dbitm = await _applicationDbContext.AccessRoles
                    .FirstOrDefaultAsync(p => p.RoleId == request.RoleId && p.AccessMenuId == item, cancellationToken);
                requestItemByMenuId.TryGetValue(item, out var Requestitm);
                if (Dbitm == null)
                    continue;
                Dbitm.HasPersianAccess = Requestitm?.HasPersianAccess;
            }
            foreach (var item in mustDeleted)
            {
                var itm = await _applicationDbContext.AccessRoles.FirstOrDefaultAsync(p => p.RoleId == request.RoleId && p.AccessMenuId == item, cancellationToken);
                if (itm != null)
                    _applicationDbContext.AccessRoles.Remove(itm);
            }
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            return await _mediator.Send(new ListAccessRoleQuery()
            {
                lang = Share.Domain.Enums.LanguageId.Fa,
                RoleId = request.RoleId,
                AccessSystemId = allSystemId.FirstOrDefault(),
            });
        }

        private void SetAllMenuIds(
            AccessRoleFullResponseItem mainMenuResponse,
            List<int> menuIds,
            Dictionary<int, AccessRoleFullResponseItem> requestItemByMenuId)
        {
            if (mainMenuResponse == null)
                return;
            if (mainMenuResponse.Children != null && mainMenuResponse.Children.Any(a => a.HasAccess))
                mainMenuResponse.HasAccess = true;
            requestItemByMenuId[mainMenuResponse.AccessMenuId] = mainMenuResponse;
            if (mainMenuResponse.HasAccess && !menuIds.Contains(mainMenuResponse.AccessMenuId))
                menuIds.Add(mainMenuResponse.AccessMenuId);

            if (mainMenuResponse.Children != null)
                foreach (var child in mainMenuResponse.Children)
                {
                    SetAllMenuIds(child, menuIds, requestItemByMenuId);
                }
        }
    }
}
