using WorkFlow.Application.Common.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Share.Domain.Exceptions;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.DeleteUser
{
    public class WorkFlowUserDeleteCommand : IRequest<Unit>
    {
        public Guid WorkFlowUserId { get; set; }
    }
    public class WorkFlowUserDeleteCommandHandler : IRequestHandler<WorkFlowUserDeleteCommand, Unit>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public WorkFlowUserDeleteCommandHandler(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }
        public async Task<Unit> Handle(WorkFlowUserDeleteCommand request, CancellationToken cancellationToken)
        {
            var WorkFlowUser = _applicationDbContext.WorkFlowUsers.FirstOrDefault(x => x.WorkFlowUserId == request.WorkFlowUserId);
            if (WorkFlowUser == null)
                throw new BadRequestExceptions("User Not Exists!");
            _applicationDbContext.WorkFlowUsers.Remove(WorkFlowUser);
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            return Unit.Value;
        }
    }
}
