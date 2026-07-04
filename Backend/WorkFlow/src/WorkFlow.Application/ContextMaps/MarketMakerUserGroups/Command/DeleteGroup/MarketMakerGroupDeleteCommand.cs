using WorkFlow.Application.Common.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Share.Domain.Enums;
using Share.Domain.Exceptions;

namespace WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Command.DeleteGroup
{
    public class WorkFlowGroupDeleteCommand : IRequest<Unit>
    {
        public WorkFlowUserGroupId WorkFlowUserGroupId { get; set; }
    }
    public class WorkFlowGroupDeleteRequestCommandHandler : IRequestHandler<WorkFlowGroupDeleteCommand, Unit>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public WorkFlowGroupDeleteRequestCommandHandler(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }
        public async Task<Unit> Handle(WorkFlowGroupDeleteCommand request, CancellationToken cancellationToken)
        {
            var WorkFlowUserGroup = _applicationDbContext.WorkFlowUserGroups.FirstOrDefault(x => x.WorkFlowUserGroupId == request.WorkFlowUserGroupId);
            if (WorkFlowUserGroup == null)
                throw new BadRequestExceptions("Group Not Exists!");
            _applicationDbContext.WorkFlowUserGroups.Remove(WorkFlowUserGroup);
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            return Unit.Value;
        }
    }
}
