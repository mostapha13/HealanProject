using AngleSharp.Css;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml.Wordprocessing;
using Healan.Application.Common.Interfaces;
using Healan.Application.Users.Dtos;
using Healan.Domain.Users.Entities;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;
using Share.Domain.Constants;

namespace Healan.Application.Users.Queries.GetUsers
{
    public class UserListQuery : AbstractSearchRequest<PaginatedList<UserListResult>>
    {
        public bool BoardMember { get; set; }
        public string FilterText { get; set; }

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
            List<Guid> userIds = null;

            if (request.BoardMember)
            {
                userIds = await _identityTool.GetRelatedUserRole(new List<string>() { "AdmissionsBoardMember", "FormerAdmissionsBoardMember" });
            }


            IQueryable<User> users = _applicationDbContext.Users.Where(c => userIds == null || userIds.Contains(c.IdentityUserId.Value));

            if (!string.IsNullOrWhiteSpace(request.FilterText))
            {
                users = users.Where(c =>
                c.FirstName.Contains(request.FilterText) ||
                c.LastName.Contains(request.FilterText) ||
                c.PhoneNumber.Contains(request.FilterText)
                );
            }

            return await users.ProjectTo<UserListResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
        }
    }

}
