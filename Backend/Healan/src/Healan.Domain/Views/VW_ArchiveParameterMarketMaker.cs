using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Views
{
    public class VW_ArchiveParameterMarketMaker
    {
        public Guid InstrumentId { get; set; }
        public int MinValue { get; set; }
        public int MaxOrder { get; set; }
        public decimal Tolerance { get; set; }
        public long Oscillation { get; set; }
        public long Liquidity { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public Guid FundId { get; set; }
        public string BrokerName { get; set; }
        public string Symbol { get; set; }
        public string SymbolName { get; set; }
        public string CompanyName { get; set; }
        public string FundName { get; set; }
    }
}
