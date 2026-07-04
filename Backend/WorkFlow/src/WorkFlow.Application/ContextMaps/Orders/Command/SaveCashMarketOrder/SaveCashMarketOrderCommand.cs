using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Orders.Command.SaveCashMarketOrder
{
    public class SaveCashMarketOrderCommand : IRequest<OrderResponse>
    {
        public Guid? UserId { get; set; }
        public WorkFlowTypeId WorkFlowTypeId { get; set; }
        public Guid? OrderId { get; set; }
        public Guid? OrderParentId { get; set; }
        public string Description { get; set; }
        public string ExtraInfo { get; set; }
    }

    public class SaveCashMarketOrderCommandHandler : IRequestHandler<SaveCashMarketOrderCommand, OrderResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ICurrentUserService _currentUserService;
        private readonly IDateTime _dateTime;
        private readonly IMediator _mediator;
        public SaveCashMarketOrderCommandHandler(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService, IDateTime dateTime, IMediator mediator)
        {
            _applicationDbContext = applicationDbContext;
            _currentUserService = currentUserService;
            _dateTime = dateTime;
            _mediator = mediator;
        }


        public async Task<OrderResponse> Handle(SaveCashMarketOrderCommand request, CancellationToken cancellationToken)
        {

            Domain.Entities.Order Order = null;
            Order = new Domain.Entities.Order();
            var maxTrackingNum = "1000000";
            if (_applicationDbContext.Orders.Any())
            {
                maxTrackingNum = _applicationDbContext.Orders.Select(s => s.TrackingNumber ?? "1000000").Max();
                maxTrackingNum = (maxTrackingNum.ToInt().Value + 1).ToString();
            }
            Order.TrackingNumber = maxTrackingNum;
            Order.IsDeleted = false;
            Order.OrderStatusId = OrderStatusId.Open;
            Order.WorkFlowUserId = await _applicationDbContext.WorkFlowUsers.Where(x => x.IdentityUserId == request.UserId).Select(x => x.WorkFlowUserId).FirstOrDefaultAsync();
            _applicationDbContext.Orders.Add(Order);


            var workFlowGuid = _applicationDbContext.WorkFlowGuides
                .FirstOrDefault(w => !w.ParentId.HasValue && w.WorkFlowTypeId == request.WorkFlowTypeId);
            if (workFlowGuid == null)
                throw new BadRequestExceptions("WorkFlowGuid Is Null");
            WorkFlowItem workFlow = new WorkFlowItem();
            workFlow.OrderId = Order.OrderId;
            workFlow.HasObserved = false;
            workFlow.WorkFlowDate = _dateTime.Now;
            workFlow.WorkFlowGuideId = workFlowGuid.WorkFlowGuideId;
            workFlow.UserId = await _applicationDbContext.WorkFlowUsers.Where(x => x.IdentityUserId == _currentUserService.UserId).Select(x => x.WorkFlowUserId).FirstOrDefaultAsync();
            Order.WorkFlowItems.Add(workFlow);

            await _applicationDbContext.SaveChangesAsync(cancellationToken);

            var result = await _mediator.Send(new GetOrderQuery() { lang = LanguageId.Fa, OrderId = Order.OrderId });
            return result;
        }
    }
}
