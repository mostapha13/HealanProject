using Share.Domain.Enums;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders;

namespace WorkFlow.Application.ContextMaps.Forms.Queries.GetForms
{
    public class OrderDetailFormByIdResponse
    {
        public OrderResponse Order { get; set; }

        public WorkFlowGroupResponse WorkFlowGroup { get; set; }
        public bool CanConfirmOrReject { get; set; }
        public FormId FormId { get; set; }
        public string Message { get; set; }
        public ICollection<CommentSummary> PrivateMessages { get; set; }
        public ICollection<CommentSummary> PublicMessages { get; set; }

    }
    public class CommentSummary
    {
        public string Comment { get; set; }
        public string MarketUserName { get; set; }
        public DateTime CommentDate { get; set; }
    }
}
