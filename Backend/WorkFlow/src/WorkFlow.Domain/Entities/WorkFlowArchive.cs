using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Domain.Entities
{
   public class WorkFlowArchive
    {
        public Guid WorkFlowArchiveId { get; set; }
        public Guid WorkFlowItemId { get; set; }
        public Guid OrderId { get; set; }
        public Guid WorkFlowGuidId { get; set; }
        public DateTime WorkFlowDate { get; set; }
        public DateTime WorkFlowArchiveDate { get; set; }
        public Guid UserId { get; set; }

        public WorkFlowGuide WorkFlowGuide { get; set; }
        public Order Order { get; set; }

    }
}
