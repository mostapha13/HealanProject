namespace WorkFlow.Domain.Entities
{
    public class OrderComment
    {
        public OrderComment()
        {
        }
        public Guid OrderCommentId { get; set; }
        public Guid OrderId { get; set; }
        public Guid WorkFlowGuidId { get; set; }
        public Guid WorkFlowUserId { get; set; }
        public string Comment { get; set; }
        public bool IsPrivate { get; set; }
        public DateTime CommentDate { get; set; }


        public WorkFlowUser WorkFlowUser { get; set; }
        public Order Order { get; set; }
        public WorkFlowGuide WorkFlowGuide { get; set; }
    }
}
