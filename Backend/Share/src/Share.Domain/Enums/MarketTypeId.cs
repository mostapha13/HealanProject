using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum MarketTypeId : byte
    {
        [Display(Name = "بازار نقد")]
        MarketCash = 1,
        [Display(Name = "آتی")]
        Feature = 2,
        [Display(Name = "تبعی")]
        Option = 3,
        [Display(Name = "بدهی")]
        Debit = 4,
        [Display(Name = "ETF")]
        ETF = 5,
        [Display(Name = "اختیار")]
        TradeOption = 7,
    }
}
