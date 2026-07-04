using WorkFlow.Application.Common.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Share.Domain.Extensions;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders
{
    public class OrderListQuery: AbstractSearchRequest<PaginatedList<OrderResponse>>
    {

    }
    public class OrderListQueryHandler : IRequestHandler<OrderListQuery, PaginatedList<OrderResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public OrderListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<PaginatedList<OrderResponse>> Handle(OrderListQuery request, CancellationToken cancellationToken)
        {
            var query = _applicationDbContext
                .Orders
                .AsNoTracking();

            var result= await query.Where(w=>!w.IsDeleted).ProjectTo<OrderResponse>(_mapper.ConfigurationProvider)
                .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);


            return result;

        }
    }

}
