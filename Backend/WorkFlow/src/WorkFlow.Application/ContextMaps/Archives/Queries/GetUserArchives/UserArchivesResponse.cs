using Share.Domain.Enums;

namespace WorkFlow.Application.ContextMaps.Archives.Queries.GetUserArchives
{
    public class UserArchivesResponse
    {
        public string FormName { get; set; }
        public string FormUrl { get; set; }
        public string SenderGroupName { get; set; }
        public string ReceiverGroupName { get; set; }
        public DateTime? WorkFlowDate { get; set; }
        public string WorkFlowTypeName { get; set; }
        public WorkFlowTypeId WorkFlowTypeId { get; set; }
        public string TrackingNumber { get; set; }
        public Guid OrderId { get; set; }

    }
}
