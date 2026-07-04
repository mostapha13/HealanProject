using WorkFlow.Application.Common.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups
{
    public class WorkFlowGroupListQuery : AbstractSearchRequest<PaginatedList<WorkFlowGroupResponse>>
    {
        public string GroupName { get; set; }
    }
    public class WorkFlowGroupListQueryHandler : IRequestHandler<WorkFlowGroupListQuery, PaginatedList<WorkFlowGroupResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public WorkFlowGroupListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<PaginatedList<WorkFlowGroupResponse>> Handle(WorkFlowGroupListQuery request, CancellationToken cancellationToken)
        {
            var query = _applicationDbContext
                .WorkFlowUserGroups
                .AsNoTracking();



            return await query.ProjectTo<WorkFlowGroupResponse>(_mapper.ConfigurationProvider)
                    .Where(w =>
                string.IsNullOrEmpty(request.GroupName) ||
                w.GroupName.Contains(request.GroupName)
                )
                .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
        }
    }

}
