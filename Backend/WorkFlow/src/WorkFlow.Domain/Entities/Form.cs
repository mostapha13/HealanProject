using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Share.Domain.Enums;

namespace WorkFlow.Domain.Entities
{
    public class Form : IEntity, IEnumKey
    {
        public Form()
        {
            WorkFlowGuides = new List<WorkFlowGuide>();
            WorkFlowTypes = new List<WorkFlowType>();
        }
        public FormId FormId { get; set; }
        public string FormName { get; set; }
        public string FormUrl { get; set; }
        public string ForwardClass { get; set; }
        public string BackwardClass { get; set; }
        public FormStateId? FormStateId { get; set; }
        public ICollection<WorkFlowType> WorkFlowTypes { get; set; }
        public byte Key => (byte)FormId;

        public void SetValues(byte key, string name)
        {
            FormId = (FormId)key;
            FormName = name;
        }
        public ICollection<WorkFlowGuide> WorkFlowGuides { get; set; }
    }
}
