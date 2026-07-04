using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Share.Domain.Enums;

namespace WorkFlow.Domain.Entities
{
    public class WorkFlowUserGroup:IEntity, IEnumKey
    {
        public WorkFlowUserGroup()
        {
            WorkFlowUsers = new List<WorkFlowUser>();
            WorkFlowGuideSenders = new List<WorkFlowGuide>();
            WorkFlowGuideReceivers = new List<WorkFlowGuide>();
        }
        public WorkFlowUserGroupId WorkFlowUserGroupId { get; set; }
        public string GroupName { get; set; }
        public ICollection<WorkFlowUser> WorkFlowUsers { get; set; }

        public ICollection<WorkFlowGuide> WorkFlowGuideSenders { get; set; }
        public ICollection<WorkFlowGuide> WorkFlowGuideReceivers { get; set; }

        public byte Key => (byte)WorkFlowUserGroupId;

        public void SetValues(byte key, string name)
        {
            WorkFlowUserGroupId = (WorkFlowUserGroupId)key;
            GroupName = name;
        }
    }
}
