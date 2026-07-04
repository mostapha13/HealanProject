using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Domain.Entities
{
    public class WorkFlowGuide
    {
        public WorkFlowGuide()
        {
            WorkFlowItems = new List<WorkFlowItem>();
            Childs = new List<WorkFlowGuide>();
            WorkFlowArchives = new List<WorkFlowArchive>();
            OrderComments = new List<OrderComment>();
        }
        public Guid WorkFlowGuideId { get; set; }
        public WorkFlowUserGroupId SenderGroupId { get; set; }
        public WorkFlowUserGroupId ReceiverGroupId { get; set; }
        public FormId FormId { get; set; }
        public WorkFlowTypeId WorkFlowTypeId { get; set; }
        public Guid? ParentId { get; set; }
        public WeightId Weight { get; set; }



        public WorkFlowUserGroup WorkFlowUserGroupSender { get; set; }
        public WorkFlowUserGroup WorkFlowUserGroupReceiver { get; set; }
        public Form Form { get; set; }
        public WorkFlowType WorkFlowType { get; set; }
        public WorkFlowGuide Parent { get; set; }


        public ICollection<WorkFlowItem> WorkFlowItems { get; set; }
        public ICollection<WorkFlowGuide> Childs { get; set; }
        public ICollection<WorkFlowArchive> WorkFlowArchives { get; set; }
        public ICollection<OrderComment> OrderComments { get; set; }

        public ICollection<WorkFlowStatusGuide> WorkFlowStatusGuides { get; set; }

    }
}
