using Share.Domain.Enums;

namespace WorkFlow.Application.ContextMaps.Cardboard.Queries.GetUserCardboardRecords
{
    public class UserCardboardRecordResponse
    {
        public string FormName { get; set; }
        //public string InstrumentId { get; set; }
        public string FormUrl { get; set; }
        public string SenderGroupName { get; set; }
        public string ReceiverGroupName { get; set; }
        public DateTime? WorkFlowDate { get; set; }
        public string WorkFlowTypeName { get; set; }
        public WorkFlowTypeId WorkFlowTypeId { get; set; }
        public string TrackingNumber { get; set; }
        public Guid OrderId { get; set; }
        public bool HasObserved { get; set; }
        public string ExtraInfo { get; set; }
        public FormStateId? FormStateId { get; set; }

    }
}
