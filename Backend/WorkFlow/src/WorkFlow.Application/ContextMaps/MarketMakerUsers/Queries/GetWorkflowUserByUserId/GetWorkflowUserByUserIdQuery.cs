using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetWorkflowUserByUserId
{
    public class GetWorkflowUserByUserIdQuery : IRequest<WorkFlowUserResponse>
    {

        public Guid? UserId { get; set; }
        public Guid? WorkFlowUserUserId { get; set; }
    }

    public class GetMarketMakerUserByUserIdQueryHandler : IRequestHandler<GetWorkflowUserByUserIdQuery, WorkFlowUserResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public GetMarketMakerUserByUserIdQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<WorkFlowUserResponse> Handle(GetWorkflowUserByUserIdQuery request, CancellationToken cancellationToken)
        {
            return await _applicationDbContext.WorkFlowUsers.Where(w =>
            (!request.UserId.HasValue || w.IdentityUserId == request.UserId) &&
            (!request.WorkFlowUserUserId.HasValue || w.WorkFlowUserId == request.WorkFlowUserUserId)

            ).ProjectTo<WorkFlowUserResponse>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();
        }
    }
}
