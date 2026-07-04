using System;

namespace Healan.Domain.Views
{
    public class CashMarketCardBoardArchivesView
    {
        public long ROW_NUM { get; set; }
        public bool IsDeleted { get; set; }
        public int OrderStatusId { get; set; }
        public string OrderStatusName { get; set; }
        public Guid BrokerId { get; set; }
        public int WorkFlowTypeId { get; set; }
        public string WorkFlowName { get; set; }
        public string BackwardClass { get; set; }
        public string ForwardClass { get; set; }
        public string FormName { get; set; }
        public string FormUrl { get; set; }
        public int FormId { get; set; }
        public string TrackingNumber { get; set; }
        public Guid InstrumentId { get; set; }
        public string SymbolName { get; set; }
        public Guid OrderId { get; set; }
        public string ReceiverGroupName { get; set; }
        public int ReceiverGroupId { get; set; }
        public string SenderGroupName { get; set; }
        public int SenderGroupId { get; set; }
        public DateTime WorkFlowDate { get; set; }
        public DateTime WorkFlowArchiveDate { get; set; }
        public bool HasObserved { get; set; }
    }
}
