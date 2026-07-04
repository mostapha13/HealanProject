using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Domain.Entities
{
    public class WorkFlowItem
    {

        public Guid WorkFlowItemId { get; set; }
        public Guid OrderId { get; set; }
        public Guid WorkFlowGuideId { get; set; }
        public DateTime WorkFlowDate { get; set; }
        public bool HasObserved { get; set; }
        public Guid UserId { get; set; }
        public Order Order { get; set; }
        public WorkFlowGuide WorkFlowGuide { get; set; }
 


    }
}
