using System;

namespace Healan.Domain.Views
{
    public class UserCardboardDraftMarketView
    {
        public long row_num { get; set; }
        public bool IsDeleted { get; set; }
        public int OrderStatusId { get; set; }
        public string OrderStatusName { get; set; }
        public Guid WorkFlowUserId { get; set; }
        public Guid OrderId { get; set; }
        public string TrackingNumber { get; set; }
        public Guid BrokerId { get; set; }
        public Guid InstrumentId { get; set; }
        public string SymbolName { get; set; }
        public string Symbol { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FormName { get; set; }
        public int WorkFlowUserGroupId { get; set; }
        public string GroupName { get; set; }
        public DateTime CreateDate { get; set; }
        public string StartForm { get; set; }
        public string SearchForm { get; set; }
        public Guid FormId { get; set; }
    }
}
