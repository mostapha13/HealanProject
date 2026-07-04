using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WorkFlow.Application.Common.Mappings;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Orders.Queries.GetOrderDraftByUserId
{
    public class OrderDraftResponse : IMapFrom<Order>
    {

        public Order Order { get; set; }
        public void Mapping(Profile profile)
        {
            profile.CreateMap<Order, OrderDraftResponse>();


        }
    }
}
