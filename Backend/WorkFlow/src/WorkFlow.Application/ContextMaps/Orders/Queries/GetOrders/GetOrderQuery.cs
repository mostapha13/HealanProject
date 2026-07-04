using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Models;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders
{
    public class GetOrderQuery : AbstractRequestBase<OrderResponse>
    {
        public Guid OrderId { get; set; }
    }
    public class GetOrderQueryHandler : IRequestHandler<GetOrderQuery, OrderResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public GetOrderQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<OrderResponse> Handle(GetOrderQuery request, CancellationToken cancellationToken)
        {
            var query = _applicationDbContext
           .Orders
           .Where(w => !w.IsDeleted)
           .AsNoTracking();

            var orderResponce = await query
                .Where(w => w.OrderId == request.OrderId)
                .ProjectTo<OrderResponse>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();


            return orderResponce;
        }

    }

}
