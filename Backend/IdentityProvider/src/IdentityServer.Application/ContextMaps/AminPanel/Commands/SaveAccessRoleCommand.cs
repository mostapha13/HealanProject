using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessRole;
using IdentityServer.Domain.Data;
using MediatR;
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
            var role = _applicationDbContext.Roles.FirstOrDefault(p => p.Id == request.RoleId);
            if (role == null)
            {
                throw new BadRequestExceptions("Role Not Exists");
            }

            var allSystemId = _applicationDbContext.AccessSystemRoles.Where(w => w.RoleId == role.Id).Select(s => s.AccessSystemId).ToList();

            var allAccessMenuId = (from am in _applicationDbContext.AccessMenus
                                   join af in _applicationDbContext.AccessForms on am.AccessFormId equals af.AccessFormId
                                   where allSystemId.Contains(af.AccessSystemId)
                                   select am.AccessMenuId).ToList();
            request.Items = request.Items.Where(w => allAccessMenuId.Contains(w.AccessMenuId)).ToList();

            List<int> allMenuIds = new List<int>();
            foreach (var item in request.Items)
            {
                if (item.Children != null && item.Children.Any(a => a.HasAccess))
                    item.HasAccess = true;
                SetAllMenuIds(item, allMenuIds);
            }
            var allExistsAccessMenuId = _applicationDbContext.AccessRoles.Where(w => w.RoleId == request.RoleId).Select(s => s.AccessMenuId).ToList();
            var mustInserted = allMenuIds.Except(allExistsAccessMenuId);
            var mustUpdated = allMenuIds.Intersect(allExistsAccessMenuId);
            var mustDeleted = allExistsAccessMenuId.Except(allMenuIds);
            foreach (var item in mustInserted)
            {
                var itm = request.Items.SelectMany(s => s.Children).FirstOrDefault(p => p.AccessMenuId == item);
                _applicationDbContext.AccessRoles.Add(new IdentityServer.Domain.Entities.AccessRole() { AccessMenuId = item, RoleId = request.RoleId, HasPersianAccess = itm?.HasPersianAccess });
            }
            foreach (var item in mustUpdated)
            {
                var Dbitm = _applicationDbContext.AccessRoles.FirstOrDefault(p => p.AccessMenuId == item);
                var Requestitm = request.Items.SelectMany(s => s.Children).FirstOrDefault(p => p.AccessMenuId == item);
                Dbitm.HasPersianAccess = Requestitm?.HasPersianAccess;
            }
            foreach (var item in mustDeleted)
            {
                var itm = _applicationDbContext.AccessRoles.FirstOrDefault(p => p.RoleId == request.RoleId && p.AccessMenuId == item);
                if (itm != null)
                    _applicationDbContext.AccessRoles.Remove(itm);
            }
            _applicationDbContext.SaveChanges();
            return await _mediator.Send(new ListAccessRoleQuery() { lang = Share.Domain.Enums.LanguageId.Fa, RoleId = request.RoleId });
        }

        private void SetAllMenuIds(AccessRoleFullResponseItem mainMenuResponse, List<int> menuIds)
        {
            if (mainMenuResponse == null)
                return;
            if (mainMenuResponse.Children != null && mainMenuResponse.Children.Any(a => a.HasAccess))
                mainMenuResponse.HasAccess = true;
            if (mainMenuResponse.HasAccess)
                menuIds.Add(mainMenuResponse.AccessMenuId);

            if (mainMenuResponse.Children != null)
                foreach (var child in mainMenuResponse.Children)
                {
                    SetAllMenuIds(child, menuIds);
                }
        }
    }
}
