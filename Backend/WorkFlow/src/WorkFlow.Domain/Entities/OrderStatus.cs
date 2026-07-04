using Share.Domain.Entities;
using System.Collections.Generic;
using Share.Domain.Enums;

#nullable disable

namespace WorkFlow.Domain.Entities
{
    public partial class OrderStatus : IEntity, IEnumKey
    {
        public OrderStatus()
        {
            Orders = new List<Order>();
        }

        public OrderStatusId OrderStatusId { get; set; }
        public string Name { get; set; }
        public ICollection<Order> Orders { get; set; }
        public ICollection<WorkFlowGuide> WorkFlowGuides { get; set; }
        public ICollection<WorkFlowStatusGuide> WorkFlowStatusGuides { get; set; }

        public byte Key => (byte)OrderStatusId;

        public void SetValues(byte key, string name)
        {
            OrderStatusId = (OrderStatusId)key;
            Name = name;
        }

    }
}
