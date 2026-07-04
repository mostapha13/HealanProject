using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Share.Domain.Enums;

namespace WorkFlow.Domain.Entities
{
    public class WorkFlowUser : IEntity
    {
        public WorkFlowUser()
        {
            OrderComments = new List<OrderComment>();
            Orders=new List<Order>();
        }
        public Guid WorkFlowUserId { get; set; }
        public Guid? IdentityUserId { get; set; }
        public Guid? FundId { get; set; }
        public Guid? BrokerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public bool IsConfirmed { get; set; }
        public WorkFlowUserGroupId WorkFlowUserGroupId { get; set; }
        public WorkFlowUserGroup WorkFlowUserGroup { get; set; }
        public Fund Fund { get; set; }
        public ICollection<OrderComment> OrderComments { get; set; }
        public ICollection<Order> Orders { get; set; }

    }
}
