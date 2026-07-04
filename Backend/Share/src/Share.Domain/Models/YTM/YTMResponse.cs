using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.YTM
{
    public class YTMResponse
    {
        public string InstrumentId { get; set; }
        public decimal? YtmLast { get; set; }
        public decimal? YtmClosing { get; set; }
    }
}
