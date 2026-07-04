using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Extensions;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders;

namespace WorkFlow.Application.ContextMaps.Orders.Command.SaveDraftOrder
{
    public class SaveDraftOrderCommand : IRequest<OrderResponse>
    {
    }

    public class SaveDraftOrderCommandHandler : IRequestHandler<SaveDraftOrderCommand, OrderResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMapper _mapper;

        public SaveDraftOrderCommandHandler(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _currentUserService = currentUserService;
            _mapper = mapper;
        }

        public async Task<OrderResponse> Handle(SaveDraftOrderCommand request, CancellationToken cancellationToken)
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
            Order.OrderStatusId = OrderStatusId.Draft;
            Order.WorkFlowUserId = await _applicationDbContext.WorkFlowUsers.Where(x => x.IdentityUserId == _currentUserService.UserId).Select(x => x.WorkFlowUserId).FirstOrDefaultAsync();
            Order.CreateDate = DateTime.Now;
            _applicationDbContext.Orders.Add(Order);

            await _applicationDbContext.SaveChangesAsync(cancellationToken);
           return  _mapper.Map<OrderResponse>(Order);
        }
    }
}
