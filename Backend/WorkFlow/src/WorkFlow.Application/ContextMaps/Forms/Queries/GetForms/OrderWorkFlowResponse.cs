using Share.Domain.Enums;
using WorkFlow.Application.Common.Mappings;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Forms.Queries.GetForms
{
    public class OrderWorkFlowResponse
    {
        public Order_WorkFlow_Response Order { get; set; }
        public List<WorkFlowGroupResponse> Groups { get; set; }
        public List<WorkFlowArchive_Simple_Response> WorkFlowItems { get; set; }
    }

    public class Order_WorkFlow_Response : IMapFrom<Order>
    {
        public Guid OrderId { get; set; }
        public string TrackingNumber { get; set; }
        public string ExtraInfo { get; set; }
    }
    public class WorkFlowArchive_Simple_Response
    {
        public int WorkFlowUserGroupKey { get; set; }
        public WorkFlowUserGroupId WorkFlowUserGroupId { get; set; }

        public string Receiver { get; set; }
        public string Sender { get; set; }

        public string WorkFlowName { get; set; }
        public Guid WorkFlowGuidId { get; set; }
        public DateTime WorkFlowDate { get; set; }
        public bool HasObserved { get; set; }
        public ICollection<CommentSummary> PrivateMessages { get; set; }
        public ICollection<CommentSummary> PublicMessages { get; set; }
    }


}
