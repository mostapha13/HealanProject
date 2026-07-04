using Share.Domain.Enums;
using System;

namespace WorkFlow.Domain.Entities
{
    public class WorkFlowStatusGuide
    {
        public Guid Id { get; set; }
        public Guid GuideId { get; set; }
        public OrderStatusId OrderStatusId { get; set; }
        public WorkFlowGuide WorkFlowGuide { get; set; }
        public OrderStatus OrderStatus { get; set; }

    }
}
