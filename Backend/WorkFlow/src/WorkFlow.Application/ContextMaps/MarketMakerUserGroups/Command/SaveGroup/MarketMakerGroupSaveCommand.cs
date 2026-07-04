using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Share.Domain.Enums;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;

namespace WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Command.SaveGroup
{
    public class WorkFlowGroupSaveCommand : IRequest<WorkFlowGroupResponse>
    {
        public WorkFlowUserGroupId? WorkFlowUserGroupId { get; set; }
        public string GroupName { get; set; }
    }
    public class WorkFlowGroupSaveCommandHandler : IRequestHandler<WorkFlowGroupSaveCommand, WorkFlowGroupResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public WorkFlowGroupSaveCommandHandler(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }
        public async Task<WorkFlowGroupResponse> Handle(WorkFlowGroupSaveCommand request, CancellationToken cancellationToken)
        {
            var WorkFlowUserGroup = _applicationDbContext.WorkFlowUserGroups.FirstOrDefault(x => x.WorkFlowUserGroupId == request.WorkFlowUserGroupId);
            if (WorkFlowUserGroup == null)
            {
                WorkFlowUserGroup = new WorkFlowUserGroup();
                _applicationDbContext.WorkFlowUserGroups.Add(WorkFlowUserGroup);
            }
            WorkFlowUserGroup.GroupName = request.GroupName;
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            return new WorkFlowGroupResponse()
            {
                WorkFlowUserGroupId = WorkFlowUserGroup.WorkFlowUserGroupId,
                GroupName = WorkFlowUserGroup.GroupName
            };
        }
    }
}
