using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.InstrumentModel
{
    public class PublicDebitInstrumentResponse
    {
        public string InstrumentId { get; set; }
        public decimal? Tradevolume { get; set; }
        public decimal? Tradevalue { get; set; }
        public decimal? Tradecount { get; set; }
        public decimal? Highvalue { get; set; }
        public decimal? Lowvalue { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public decimal? Firstprice { get; set; }
        public decimal? Lastprice { get; set; }
        public decimal? Lastpricechange { get; set; }
        public decimal? Lastpricechangepercent { get; set; }
        public decimal? Closingprice { get; set; }
        public decimal? Closingpricechange { get; set; }
        public decimal? Closingpricechangepercent { get; set; }
        public decimal? YesterdayPrice { get; set; }
        public string Effectonindex { get; set; }

        public decimal? Marketvalue { get; set; }
        public decimal? Sellprice { get; set; }
        public decimal? Sellquantity { get; set; }
        public decimal? Sellcount { get; set; }
        public decimal? Buyprice { get; set; }
        public decimal? Buyquantity { get; set; }
        public decimal? Buycount { get; set; }
        public decimal? Marketid { get; set; }
        public string Markettypeid { get; set; }
        public decimal? Activemarkettypeid { get; set; }
        public string Securitiesid { get; set; }
        public string Stateid { get; set; }
        public DateTime? Tarixsarresid { get; set; }

    }
}
