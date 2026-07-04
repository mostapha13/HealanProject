using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Orders.Queries.GetOrderDraftByUserId
{
    public class GetOrderDraftByUserIdQuery:IRequest<List<Order>>
    {
        public Guid UserId { get; set; }
    }

    public class GetOrderDraftByUserIdQueryHandler : IRequestHandler<GetOrderDraftByUserIdQuery, List<Order>>
    {
        private readonly IApplicationDbContext _applicationDbContext;

        public GetOrderDraftByUserIdQueryHandler(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }

        public async Task<List<Order>> Handle(GetOrderDraftByUserIdQuery request, CancellationToken cancellationToken)
        {
            //OLD
            //_applicationDbContext.Orders.Include(x => x.WorkFlows.Where(x => x.UserId == _currentUserService.UserId)).Where(x => x.OrderStatusId == OrderStatusId.Draft).ToList();

            return await _applicationDbContext.Orders.Where(x=>x.WorkFlowUserId==request.UserId)
                .Where(x => x.OrderStatusId == OrderStatusId.Draft).ToListAsync();
        }
    }
}
