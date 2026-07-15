using AutoMapper;
using Healan.Application.Common.Interfaces;
using Healan.Application.Users.Dtos;
using Healan.Domain.Users.Entities;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
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

            IQueryable<User> users = _applicationDbContext.Users.AsNoTracking().Include(u => u.Company);

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

            // Avoid ProjectTo + GetDisplayName() (not SQL-translatable → 500).
            var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
            var pageSize = request.PageSize < 1 ? 10 : Math.Min(request.PageSize, 20);
            var totalCount = await users.CountAsync(cancellationToken);
            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
            if (totalPages > 0 && pageNumber > totalPages)
                pageNumber = totalPages;

            var entities = await users
                .OrderBy(u => u.UserId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var items = _mapper.Map<List<UserListResult>>(entities);
            return new PaginatedList<UserListResult>(items, totalCount, pageNumber, pageSize);
        }
    }
}
