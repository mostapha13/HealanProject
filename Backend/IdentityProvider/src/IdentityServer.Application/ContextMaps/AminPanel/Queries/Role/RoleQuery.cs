using AutoMapper;
using IdentityServer.Domain.Data;
using MediatR;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Models;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.Role
{

    public class RoleQuery : AbstractRequestBase<List<RoleResponse>>
    {
        public int AccessSystemId { get; set; }
        public string SearchText { get; set; }
    }
    public class RoleQueryHandler : IRequestHandler<RoleQuery, List<RoleResponse>>
    {
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        public RoleQueryHandler(ApplicationDbContext applicationDbContext, IMapper mapper, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }
        public async Task<List<RoleResponse>> Handle(RoleQuery request, CancellationToken cancellationToken)
        {
            var q = from ur in _applicationDbContext.UserRoles
                    join role in _applicationDbContext.Roles on ur.RoleId equals role.Id
                    join accessRole in _applicationDbContext.AccessSystemRoles on role.Id equals accessRole.RoleId
                    where ur.UserId == _currentUserService.UserId
                    select accessRole.RoleId;


            var roleIds = q.Distinct().ToList();



            var allRoles = _applicationDbContext.Roles.Where(w => roleIds.Contains(w.Id)).ToList();// == request.AccessSystemId).ToList();
            List<RoleResponse> roles = new List<RoleResponse>();
            foreach (var item in allRoles)
            {
                if (!string.IsNullOrEmpty(request.SearchText) && !item.Name.Contains(request.SearchText) && (string.IsNullOrEmpty(item.DisplayName) || !item.DisplayName.Contains(request.SearchText)))
                    continue;
                roles.Add(new RoleResponse() { RoleId = item.Id, RoleName = item.Name, RoleTitle = item.DisplayName });
            }

            return roles;
        }

    }
}
