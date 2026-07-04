using Share.Domain.Enums;

namespace Healan.Domain.Views
{
    public class InstrumentParameterView
    {
        public long row_num { get; set; }
        public Guid? InstrumentId { get; set; }
        public string Symbol { get; set; }
        public string SymbolName { get; set; }
        public string SymbolCode { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public DateTime CreateDate { get; set; }
        public long liquidity { get; set; }
        public int MaxOrder { get; set; }
        public int MinValue { get; set; }
        public long Oscillation { get; set; }
        public int Tolerance { get; set; }
        public string UserNameCreator { get; set; }
        public string UserNameUpdator { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string MarketMakerName { get; set; }
        public WorkFlowUserGroupId? MarketMakerUserGroupId { get; set; }
        public Guid? MarketMakerUserId { get; set; }
    }
}
