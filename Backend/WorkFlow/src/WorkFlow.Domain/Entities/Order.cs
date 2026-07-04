using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Domain.Entities
{
    public class Order
    {
        public Order()
        {
            WorkFlowItems = new List<WorkFlowItem>();
            WorkFlowArchives = new List<WorkFlowArchive>();
            OrderComments = new List<OrderComment>();
        }
        public Guid OrderId { get; set; }
        public Guid? OrderParentId { get; set; }
        public Guid? FundId { get; set; }
        public OrderStatusId OrderStatusId { get; set; }
        public string TrackingNumber { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsDeny { get; set; }
        public string Description { get; set; }
        public Guid? WorkFlowUserId { get; set; }
        public DateTime? CreateDate { get; set; }

        public string ExtraInfo { get; set; }
        public ICollection<WorkFlowItem> WorkFlowItems { get; set; }
        public ICollection<WorkFlowArchive> WorkFlowArchives { get; set; }
        public ICollection<OrderComment> OrderComments { get; set; }

        public ICollection<Order> OrderChilds { get; set; }
        public Order ParentOrder { get; set; }
        public Fund Fund { get; set; }
        public OrderStatus OrderStatus { get; set; }
        public WorkFlowUser WorkFlowUser { get; set; }

    }
}
