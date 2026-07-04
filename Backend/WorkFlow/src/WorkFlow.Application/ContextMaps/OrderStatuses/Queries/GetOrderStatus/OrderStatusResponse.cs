using AutoMapper;
using WorkFlow.Application.Common.Mappings;
using WorkFlow.Domain.Entities;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Application.ContextMaps.OrderStatuses.Queries.GetOrderStatus
{
    public class OrderStatusResponse : IMapFrom<OrderStatus>
    {
        public OrderStatusId OrderStatusId { get; set; }
        public string Name { get; set; }

    }
}
