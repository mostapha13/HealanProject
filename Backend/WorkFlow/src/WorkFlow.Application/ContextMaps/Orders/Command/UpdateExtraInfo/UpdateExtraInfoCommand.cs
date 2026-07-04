using MediatR;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Orders.Command.UpdateExtraInfo
{
    public class UpdateExtraInfoCommand : IRequest<OrderResponse>
    {
        public Guid OrderId { get; set; }
        public string ExtraInfo { get; set; }
    }
    public class UpdateExtraInfoCommandHandler : IRequestHandler<UpdateExtraInfoCommand, OrderResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMediator _mediator;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<UpdateExtraInfoCommandHandler> _logger;
        private readonly IWorkFlowGuidService _workFlowGuidService;
        private readonly IDateTime _dateTime;
        public UpdateExtraInfoCommandHandler(IApplicationDbContext applicationDbContext, IMediator mediator, ICurrentUserService currentUserService, ILogger<UpdateExtraInfoCommandHandler> logger, IWorkFlowGuidService workFlowGuidService, IDateTime dateTime)
        {
            _applicationDbContext = applicationDbContext;
            _mediator = mediator;
            _currentUserService = currentUserService;
            _logger = logger;
            _workFlowGuidService = workFlowGuidService;
            _dateTime = dateTime;
        }
        public async Task<OrderResponse> Handle(UpdateExtraInfoCommand request, CancellationToken cancellationToken)
        {


            var Order = _applicationDbContext.Orders.FirstOrDefault(x => x.OrderId == request.OrderId);

            if (Order == null)
            {
                throw new BadRequestExceptions("Order Not Extis");
            }
            else
            {

                Order.ExtraInfo = request.ExtraInfo;
                await _applicationDbContext.SaveChangesAsync(cancellationToken);
            }
            var result = await _mediator.Send(new GetOrderQuery() { lang = LanguageId.Fa, OrderId = Order.OrderId });
            return result;
        }
    }
}
