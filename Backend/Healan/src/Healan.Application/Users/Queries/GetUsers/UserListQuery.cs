using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Users.Dtos;
using Healan.Domain.Users.Entities;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Users.Queries.GetUsers
{
    public class UserListQuery : AbstractSearchRequest<PaginatedList<UserListResult>>
    {
        public bool BoardMember { get; set; }
        public string? FilterText { get; set; }
    }

    public class UserListQueryHandler : IRequestHandler<UserListQuery, PaginatedList<UserListResult>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly IIdentityTool _identityTool;

        public UserListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IIdentityTool identityTool)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _identityTool = identityTool;
        }

        public async Task<PaginatedList<UserListResult>> Handle(UserListQuery request, CancellationToken cancellationToken)
        {
            List<Guid>? userIds = null;

            if (request.BoardMember)
            {
                userIds = await _identityTool.GetRelatedUserRole(new List<string>()
                {
                    "AdmissionsBoardMember",
                    "FormerAdmissionsBoardMember",
                });
            }

            IQueryable<User> users = _applicationDbContext.Users;

            if (userIds != null)
            {
                users = users.Where(c =>
                    c.IdentityUserId.HasValue && userIds.Contains(c.IdentityUserId.Value));
            }

            if (!string.IsNullOrWhiteSpace(request.FilterText))
            {
                var filter = request.FilterText.Trim();
                users = users.Where(c =>
                    (c.FirstName != null && c.FirstName.Contains(filter)) ||
                    (c.LastName != null && c.LastName.Contains(filter)) ||
                    (c.PhoneNumber != null && c.PhoneNumber.Contains(filter)));
            }

            return await users
                .ProjectTo<UserListResult>(_mapper.ConfigurationProvider)
                .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
        }
    }
}
