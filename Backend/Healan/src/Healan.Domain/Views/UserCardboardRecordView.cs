using Share.Domain.Enums;

namespace Healan.Domain.Views
{
    public class UserCardboardRecordView
    {
        public long row_num { get; set; }
        public Guid OrderId { get; set; }
        public Guid? OrderParentId { get; set; }
        public Guid? FundId { get; set; }
        public OrderStatusId OrderStatusId { get; set; }
        public string TrackingNumber { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsDeny { get; set; }
        public string Description { get; set; }
        public Guid? WorkFlowUserId { get; set; }
        public DateTime? CreateDate { get; set; }
        public string ExtraInfo { get; set; }
        public bool HasObserved { get; set; }
        public Guid UserId { get; set; }
        public DateTime WorkFlowDate { get; set; }
        public Guid WorkFlowGuideId { get; set; }
        public Guid WorkFlowItemId { get; set; }
        public Guid? InstrumentId { get; set; }
        public string SymbolCode { get; set; }
        public string Symbol { get; set; }
        public string SymbolName { get; set; }
        public MarketTypeId? MarketTypeId { get; set; }
        public long? Investment { get; set; }
        public string CompanyName { get; set; }
        public string SenderGroupName { get; set; }
        public string ReceiverGroupName { get; set; }
        public string WorkFlowTypeName { get; set; }
        public WorkFlowTypeId WorkFlowTypeId { get; set; }
        public string FormName { get; set; }
        public string FormUrl { get; set; }

        public string FormNameRecord { get; set; }
        public string FormUrlRecord { get; set; }
        public FormStateId? FormStateId { get; set; }

        public WorkFlowUserGroupId SenderGroupId { get; set; }
        public WorkFlowUserGroupId ReceiverGroupId { get; set; }
        public FormId FormId { get; set; }
        public string BackwardClass { get; set; }
        public string ForwardClass { get; set; }
    }
}
