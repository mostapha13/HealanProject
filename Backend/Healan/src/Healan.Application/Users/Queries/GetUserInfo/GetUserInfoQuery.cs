using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Users.Dtos;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;

namespace Healan.Application.Users.Queries.GetUserInfo;
public class GetUserInfoQuery : IRequest<UserResult>
{
    public int UserId { get; set; }
}

public class GetUserInfoQueryHandler : IRequestHandler<GetUserInfoQuery, UserResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly IIdentityTool _identityTool;
    public GetUserInfoQueryHandler(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService, IMapper mapper, IIdentityTool identityTool)
    {
        _applicationDbContext = applicationDbContext;
        _currentUserService = currentUserService;
        _mapper = mapper;
        _identityTool = identityTool;
    }
    public async Task<UserResult> Handle(GetUserInfoQuery request, CancellationToken cancellationToken)
    {

        var users = _applicationDbContext.Users.Where(w => w.UserId == request.UserId);

        var result = await users.ProjectTo<UserResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();


        var summary = await _identityTool.GetUserSummaryInfo(new IdentityServer.GrpcClient.GetByIdRequest() { UserId = result.IdentityUserId?.ToString() });
        if (summary != null && summary.RoleInfos != null)
        {
            result.UserRoles = new List<UserRole>();
            foreach (var item in summary.RoleInfos)
            {
                result.UserRoles.Add(new UserRole(item.RoleName, item.RoleTitle));
            }
        }
        return result;

    }
}
