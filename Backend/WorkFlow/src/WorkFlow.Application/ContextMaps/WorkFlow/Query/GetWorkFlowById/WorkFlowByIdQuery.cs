using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Share.Application.Common.Models;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.WorkFlow.Query.GetWorkFlowById
{
    public class WorkFlowByIdQuery : AbstractRequestBase<WorkFlowResponse>
    {
        public Guid? WorkFlowItemId { get; set; }
        public Guid? OrderId { get; set; }
    }
    public class WorkFlowByIdQueryHandler : IRequestHandler<WorkFlowByIdQuery, WorkFlowResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly ILogger<WorkFlowByIdQueryHandler> _logger;
        public WorkFlowByIdQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, ILogger<WorkFlowByIdQueryHandler> logger)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _logger = logger;
        }
        public async Task<WorkFlowResponse> Handle(WorkFlowByIdQuery request, CancellationToken cancellationToken)
        {
            WorkFlowResponse workFlowResponse2 = new();
            _logger.LogWarning($"Start WorkFlowByIdQueryHandler...");
            var result = await _applicationDbContext.WorkFlowItems.ProjectTo<WorkFlowResponse>(_mapper.ConfigurationProvider)
                 .Where(w =>
                 request.WorkFlowItemId.HasValue && w.WorkFlowItemId == request.WorkFlowItemId
                 ||
                 request.OrderId.HasValue && w.OrderId == request.OrderId
                 )
                 .FirstOrDefaultAsync(cancellationToken);

            _logger.LogWarning($"WorkFlowByIdQueryHandler is: {JsonConvert.SerializeObject(result)}");
            return result;
        }
    }

}
