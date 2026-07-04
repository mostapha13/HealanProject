using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Share.Domain.Enums;

namespace WorkFlow.Domain.Entities
{
    public class WorkFlowType : IEntity, IEnumKey
    {
        public WorkFlowType()
        {
            WorkFlowGuides = new List<WorkFlowGuide>();
        }
        public WorkFlowTypeId WorkFlowTypeId { get; set; }
        public string WorkFlowName { get; set; }
        public FormId? RecordFormId { get; set; }

        public Form Form { get; set; }
        public ICollection<WorkFlowGuide> WorkFlowGuides { get; set; }


        public byte Key => (byte)WorkFlowTypeId;

        public void SetValues(byte key, string name)
        {
            WorkFlowTypeId = (WorkFlowTypeId)key;
            WorkFlowName = name;
        }
    }
}
