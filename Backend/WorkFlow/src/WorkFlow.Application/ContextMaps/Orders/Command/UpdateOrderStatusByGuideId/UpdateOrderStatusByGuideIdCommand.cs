using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Orders.Command.UpdateOrderStatusByGuideId
{
    public class UpdateOrderStatusByGuideIdCommand : IRequest<Unit>
    {
        public Guid GuideId { get; set; }
    }

    public class UpdateOrderStatusByGuideIdCommandHandler : IRequestHandler<UpdateOrderStatusByGuideIdCommand, Unit>
    {
        private readonly IApplicationDbContext _applicationDbContext;

        public UpdateOrderStatusByGuideIdCommandHandler(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }
        public async Task<Unit> Handle(UpdateOrderStatusByGuideIdCommand request, CancellationToken cancellationToken)
        {
            var workFlow = await _applicationDbContext.WorkFlowItems.Where(x => x.WorkFlowGuideId == request.GuideId).FirstOrDefaultAsync();

            var workFlowStatusGuide = await _applicationDbContext.WorkFlowStatusGuides.Where(x => x.GuideId == workFlow.WorkFlowGuideId).FirstOrDefaultAsync();
            if (workFlowStatusGuide != null)
            {
                Order order = await _applicationDbContext.Orders.Where(x => x.OrderId == workFlow.OrderId).FirstOrDefaultAsync();

                order.OrderStatusId = workFlowStatusGuide.OrderStatusId;
                _applicationDbContext.Orders.Update(order);
                await _applicationDbContext.SaveChangesAsync(cancellationToken);
            }
            return Unit.Value;
        }
    }
}
