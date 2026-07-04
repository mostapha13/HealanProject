using AutoMapper;
using WorkFlow.Application.Common.Mappings;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers;
using WorkFlow.Application.ContextMaps.OrderStatuses.Queries.GetOrderStatus;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders
{
    public class OrderResponse : IMapFrom<Order>
    {
        public Guid OrderId { get; set; }
        public string Description { get; set; }
        public OrderStatusResponse OrderStatus { get; set; }
        public OrderParentResponse ParentOrder { get; set; }
        public SimpleWorkFlowUserResponse WorkFlowUser { get; set; }
        public string TrackingNumber { get; set; }
        public string ExtraInfo { get; set; }
        public void Mapping(Profile profile)
        {
            profile.CreateMap<Order, OrderResponse>();
            profile.CreateMap<Order, OrderStatusResponse>();
            profile.CreateMap<Order, OrderParentResponse>();


        }


    }


    public class OrderParentResponse
    {
        public Guid OrderId { get; set; }
        public OrderStatusResponse OrderStatus { get; set; }

        public string TrackingNumber { get; set; }
    }

}
