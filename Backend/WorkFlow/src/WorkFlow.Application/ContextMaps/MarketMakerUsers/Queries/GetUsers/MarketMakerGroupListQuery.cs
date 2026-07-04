using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers
{
    public class WorkFlowUserListQuery : AbstractSearchRequest<PaginatedList<WorkFlowUserResponse>>
    {
        public string UserName { get; set; }
    }
    public class WorkFlowUserListQueryHandler : IRequestHandler<WorkFlowUserListQuery, PaginatedList<WorkFlowUserResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public WorkFlowUserListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<PaginatedList<WorkFlowUserResponse>> Handle(WorkFlowUserListQuery request, CancellationToken cancellationToken)
        {

            var query = _applicationDbContext
               .WorkFlowUsers
               .Where(w =>
                string.IsNullOrEmpty(request.UserName) ||
                w.FirstName.Contains(request.UserName) ||
                w.LastName.Contains(request.UserName) ||
                w.PhoneNumber.Contains(request.UserName) ||
                w.Fund != null && w.Fund.FundName.Contains(request.UserName)
                )
                .AsNoTracking();

            return await query.ProjectTo<WorkFlowUserResponse>(_mapper.ConfigurationProvider)
                .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

        }
    }

}
