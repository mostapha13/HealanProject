using AutoMapper;
using WorkFlow.Application.Common.Mappings;
using WorkFlow.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Share.Domain.Enums;

namespace WorkFlow.Application.ContextMaps.WorkFlow.Query.GetWorkFlowById
{
    public class WorkFlowResponse : IMapFrom<WorkFlowItem>
    {
        public Guid WorkFlowItemId { get; set; }
        public Guid OrderId { get; set; }
        public Guid WorkFlowGuideId { get; set; }
        public DateTime WorkFlowDate { get; set; }
        public bool HasObserved { get; set; }
        public Guid UserId { get; set; }
        public WorkFlowGuideResponse WorkFlowGuide { get; set; }

    }
    public class WorkFlowGuideResponse : IMapFrom<WorkFlowGuide>
    {
        public Guid WorkFlowGuideId { get; set; }
        public WorkFlowUserGroupId SenderGroupId { get; set; }
        public WorkFlowUserGroupId ReceiverGroupId { get; set; }
        public FormId FormId { get; set; }
        public WorkFlowTypeId WorkFlowTypeId { get; set; }
        public Guid? ParentId { get; set; }
        public WeightId Weight { get; set; }

    }
}
