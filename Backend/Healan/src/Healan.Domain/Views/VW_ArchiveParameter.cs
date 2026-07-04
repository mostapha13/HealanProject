using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Views
{
    public class VW_ArchiveParameter
    {
        public Guid InstrumentId { get; set; }
        public int MinValue { get; set; }
        public int MaxOrder { get; set; }
        public decimal Tolerance { get; set; }
        public long Oscillation { get; set; }
        public long liquidity { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string Symbol { get; set; }
        public string SymbolName { get; set; }
        public string CompanyName { get; set; }
    }
}
