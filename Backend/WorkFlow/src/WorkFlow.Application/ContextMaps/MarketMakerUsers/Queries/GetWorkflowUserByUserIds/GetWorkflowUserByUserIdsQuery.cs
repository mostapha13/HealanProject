using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetWorkflowUserByUserIds
{
    public class GetWorkflowUserByUserIdsQuery : IRequest<List<WorkFlowUserResponse>>
    {

        public List<Guid> UserIds { get; set; }
        public List<Guid> WorkFlowUserUserIds { get; set; }
    }

    public class GetMarketMakerUserByUserIdsQueryHandler : IRequestHandler<GetWorkflowUserByUserIdsQuery, List<WorkFlowUserResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public GetMarketMakerUserByUserIdsQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<List<WorkFlowUserResponse>> Handle(GetWorkflowUserByUserIdsQuery request, CancellationToken cancellationToken)
        {
            var result = await _applicationDbContext.WorkFlowUsers.Where(w =>
            (request.UserIds == null || !request.UserIds.Any() || request.UserIds.Contains(w.IdentityUserId.Value)) &&
           (request.WorkFlowUserUserIds == null || !request.WorkFlowUserUserIds.Any() || request.WorkFlowUserUserIds.Contains(w.WorkFlowUserId))

            ).ProjectTo<WorkFlowUserResponse>(_mapper.ConfigurationProvider).ToListAsync(cancellationToken);
            return result;
        }
    }
}
