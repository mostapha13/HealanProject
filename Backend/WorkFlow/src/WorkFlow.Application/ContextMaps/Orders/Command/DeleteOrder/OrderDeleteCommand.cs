using MediatR;
using Share.Application.Common.Interfaces;
using Share.Domain.Exceptions;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Orders.Command.DeleteOrder
{
    public class OrderDeleteCommand : IRequest<Unit>
    {
        public Guid OrderId { get; set; }
    }
    public class OrderDeleteCommandHandler : IRequestHandler<OrderDeleteCommand, Unit>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ICurrentUserService _currentUserService;
        public OrderDeleteCommandHandler(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _currentUserService = currentUserService;
        }
        public async Task<Unit> Handle(OrderDeleteCommand request, CancellationToken cancellationToken)
        {
            var cuurentUserId = _currentUserService.UserId;
            if (cuurentUserId == Guid.Empty)
            {
                throw new UnauthorizedAccessException("ابتدا وارد سامانه شوید");
            }
            var Order = _applicationDbContext.Orders.FirstOrDefault(x => x.OrderId == request.OrderId);
            if (Order == null)
                throw new BadRequestExceptions("Order Not Exists!");
            Order.IsDeleted = true;
            await _applicationDbContext.SaveChangesAsync(cancellationToken);


            return Unit.Value;
        }
    }
}
