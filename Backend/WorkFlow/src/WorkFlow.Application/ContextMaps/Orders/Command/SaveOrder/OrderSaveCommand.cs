using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Orders.Command.SaveOrder
{
    public class OrderSaveCommand : IRequest<OrderResponse>
    {
        public Guid? UserId { get; set; }
        public WorkFlowTypeId WorkFlowTypeId { get; set; }
        public Guid? OrderId { get; set; }
        public Guid? OrderParentId { get; set; }
        public string Description { get; set; }
        public string ExtraInfo { get; set; }
    }
    public class OrderSaveCommandHandler : IRequestHandler<OrderSaveCommand, OrderResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMediator _mediator;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<OrderSaveCommandHandler> _logger;
        private readonly IWorkFlowGuidService _workFlowGuidService;
        private readonly IDateTime _dateTime;
        public OrderSaveCommandHandler(IApplicationDbContext applicationDbContext, IMediator mediator, ICurrentUserService currentUserService, ILogger<OrderSaveCommandHandler> logger, IWorkFlowGuidService workFlowGuidService, IDateTime dateTime)
        {
            _applicationDbContext = applicationDbContext;
            _mediator = mediator;
            _currentUserService = currentUserService;
            _logger = logger;
            _workFlowGuidService = workFlowGuidService;
            _dateTime = dateTime;
        }
        public async Task<OrderResponse> Handle(OrderSaveCommand request, CancellationToken cancellationToken)
        {
            Guid? fundId = null;
            var cuurentUserId = request.UserId;
            if (!cuurentUserId.HasValue || cuurentUserId == Guid.Empty)
                cuurentUserId = _currentUserService.UserId;
            if (cuurentUserId == Guid.Empty)
            {
                // cuurentUserId = _applicationDbContext.WorkFlowUsers.Where(w=>w.IdentityUserId.HasValue).FirstOrDefault().IdentityUserId.Value;
                throw new UnauthorizedAccessException("ابتدا وارد سامانه شوید");
            }
            if (request.WorkFlowTypeId == 0)
            {
                throw new UnauthorizedAccessException("نوع درخواست مشخص نشده است");
            }

            var user = _applicationDbContext.WorkFlowUsers.FirstOrDefault(w => w.IdentityUserId == cuurentUserId);
            if (user != null)
                fundId = user.FundId;


            var Order = _applicationDbContext.Orders.FirstOrDefault(x => x.OrderId == request.OrderId);

            var workFlowGuid0 = _applicationDbContext.WorkFlowGuides.ToList();

            var workFlowGuid1 = _applicationDbContext.WorkFlowGuides
              .Where(w => w.WorkFlowTypeId == request.WorkFlowTypeId).ToList();


            var workFlowGuid = _applicationDbContext.WorkFlowGuides
                .FirstOrDefault(w => !w.ParentId.HasValue && w.WorkFlowTypeId == request.WorkFlowTypeId);
            if (workFlowGuid == null)
                throw new BadRequestExceptions("WorkFlowGuid Is Null");


            WorkFlowItem workFlow = new WorkFlowItem();
            workFlow.HasObserved = false;
            workFlow.WorkFlowDate = DateTimeHelper.GetCurrentDateTime();
            workFlow.WorkFlowGuideId = workFlowGuid.WorkFlowGuideId;
            workFlow.UserId = _currentUserService.UserId;

            if (Order == null)
            {
                Order = new Order();
                Order.OrderParentId = request.OrderParentId;
                Order.CreateDate = _dateTime.Now;
                var maxTrackingNum = "1000000";
                if (_applicationDbContext.Orders.Any())
                {
                    maxTrackingNum = _applicationDbContext.Orders.Select(s => s.TrackingNumber ?? "1000000").Max();
                    maxTrackingNum = (maxTrackingNum.ToInt().Value + 1).ToString();
                }
                Order.TrackingNumber = maxTrackingNum;
                Order.IsDeleted = false;
                Order.OrderStatusId = OrderStatusId.Open;

                _applicationDbContext.Orders.Add(Order);
            }
            else
            {
                Order.OrderStatusId = OrderStatusId.Open;
                var currentWorkFlow = await _applicationDbContext.WorkFlowItems.FirstOrDefaultAsync(p => p.OrderId == request.OrderId);
                //if (currentWorkFlow == null)
                //    throw new BadRequestExceptions("Current Work flow Is Null!");
                if (currentWorkFlow != null)
                {
                    _applicationDbContext.WorkFlowItems.Remove(currentWorkFlow);

                    _applicationDbContext.WorkFlowArchives.Add(new WorkFlowArchive()
                    {
                        OrderId = currentWorkFlow.OrderId,
                        WorkFlowArchiveDate = DateTimeHelper.GetCurrentDateTime(),
                        WorkFlowDate = currentWorkFlow.WorkFlowDate,
                        WorkFlowItemId = currentWorkFlow.WorkFlowItemId,
                        WorkFlowGuidId = currentWorkFlow.WorkFlowGuideId,
                        UserId = currentWorkFlow.UserId
                    });
                }


            }
            Order.FundId = fundId;
            Order.Description = request.Description;
            Order.ExtraInfo = request.ExtraInfo;
            Order.WorkFlowItems.Add(workFlow);

            Order.WorkFlowUserId = user.WorkFlowUserId;
            try
            {
                await _applicationDbContext.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {

                throw;
            }
            var result = await _mediator.Send(new GetOrderQuery() { lang = LanguageId.Fa, OrderId = Order.OrderId });
            return result;
        }
    }
}
