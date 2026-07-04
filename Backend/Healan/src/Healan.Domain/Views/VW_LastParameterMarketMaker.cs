using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Views
{
    public class VW_LastParameterMarketMaker
    {
        public int ID { get; set; }
        public Guid InstrumentId { get; set; }
        public int MinValue { get; set; }
        public int MaxOrder { get; set; }
        public decimal Tolerance { get; set; }
        public long Oscillation { get; set; }
        public long Liquidity { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public Guid FundId { get; set; }
        public string BrokerName { get; set; }
        public string Symbol { get; set; }
        public string SymbolName { get; set; }
        public string CompanyName { get; set; }
        public string FundName { get; set; }
    }
}
