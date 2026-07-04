using Share.Domain.Enums;

namespace Healan.Domain.Views
{
    public class InstrumentWatchView
    {
        public long row_num { get; set; }
        public Guid InstrumentId { get; set; }
        public string Symbol { get; set; }
        public string SymbolCode { get; set; }
        public string SymbolName { get; set; }
        public long Invesment { get; set; }
        public DateTime FromDate { get; set; }
        public Guid InstrumentParameterId { get; set; }
        public bool IsEdited { get; set; }
        public long liquidity { get; set; }
        public int MaxOrder { get; set; }
        public int MinValue { get; set; }
        public long Oscillation { get; set; }
        public DateTime? ToDate { get; set; }
        public int Tolerance { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string MarketMakerUserName { get; set; }
        public Guid? MarketMakerUserId { get; set; }
        public Guid? OrderId { get; set; }
        public WorkFlowTypeId? WorkFlowTypeId { get; set; }


    }
}
