using AutoMapper;
using AutoMapper.QueryableExtensions;
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
            var result = _applicationDbContext.AccessMenus.Include(a => a.AccessForm).Where(w => !w.ParentRef.HasValue && w.AccessForm.AccessSystemId == request.AccessSystemId).OrderBy(o => o.Order)
                .ProjectTo<AccessRoleFullResponseItem>(_mapper.ConfigurationProvider).ToList();

            var allAccessRole = _applicationDbContext.AccessRoles.Where(w => w.RoleId == request.RoleId).ToList();

            foreach (var item in result)
            {
                SetLevel(allAccessRole, item, 0);
            }
            foreach (var item in result)
            {
                if (item.Children != null && item.Children.Any())
                    item.HasAccess = item.Children.All(w => w.HasAccess);
                FixAccess(allAccessRole, item);
            }
            AccessRoleFullResponse accessRoleFullResponse = new AccessRoleFullResponse();
            accessRoleFullResponse.RoleId = request.RoleId.Value;
            accessRoleFullResponse.Items = result;
            return accessRoleFullResponse;
        }
        private void SetLevel(List<IdentityServer.Domain.Entities.AccessRole> accessRoles, AccessRoleFullResponseItem mainMenuResponse, int level)
        {
            if (mainMenuResponse == null)
                return;
            level++;
            mainMenuResponse.Level = level;
            mainMenuResponse.HasAccess = accessRoles.Where(w => w.AccessMenuId == mainMenuResponse.AccessMenuId).Any();
            mainMenuResponse.Title = mainMenuResponse?.AccessForm?.FormTitle;
            if (mainMenuResponse.Children != null)
                foreach (var child in mainMenuResponse.Children)
                {
                    SetLevel(accessRoles, child, mainMenuResponse.Level);
                }
        }
        private void FixAccess(List<IdentityServer.Domain.Entities.AccessRole> accessRoles, AccessRoleFullResponseItem mainMenuResponse)
        {
            if (mainMenuResponse == null)
                return;

            if (mainMenuResponse.Children != null && mainMenuResponse.Children.Any())
                mainMenuResponse.HasAccess = mainMenuResponse.Children.All(w => w.HasAccess);

            if (mainMenuResponse.Children != null)
                foreach (var child in mainMenuResponse.Children)
                {
                    FixAccess(accessRoles, child);
                }
        }
    }
}
