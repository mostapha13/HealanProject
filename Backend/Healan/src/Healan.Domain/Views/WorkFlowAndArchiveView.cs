using Share.Domain.Enums;

namespace Healan.Domain.Views
{
    public class WorkFlowAndArchiveView
    {
        public long row_num { get; set; }
        public Guid InstrumentId { get; set; }
        public Guid? FundId { get; set; }
        public Guid? BrokerId { get; set; }
        public WorkFlowTypeId? WorkFlowTypeId { get; set; }
        public string WorkFlowName { get; set; }
        public DateTime? CreateDate { get; set; }
        public string FormName { get; set; }
        public string TrackingNumber { get; set; }
        public WorkFlowUserGroupId? SenderGroupId { get; set; }
        public WorkFlowUserGroupId? ReceiverGroupId { get; set; }





        public DateTime? WorkFlowDate { get; set; }
        public Guid OrderId { get; set; }
        public bool HasObserved { get; set; }
        public string ExtraInfo { get; set; }
        public string FormUrl { get; set; }
    }
}
