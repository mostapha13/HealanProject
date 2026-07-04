using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum AccessSystemId : byte
    {
        [Display(Name = "بازارگردان")]
        MarketMaker = 1,
        [Display(Name = "ابزارهای نوین")]
        NewInstrument = 2,
        [Display(Name = "پنل ادمین")]
        CMS = 3,
        [Display(Name = "پذیرش")]
        Listing = 4,
        [Display(Name = "اطلاعات نهان")]
        Insidery = 5,
        [Display(Name = "حاکمیت شرکتی")]
        CorporateSurvey = 7,
        [Display(Name = "بازار سهام")]
        CashMarket = 8,
        [Display(Name = "تالارهای مناطق")]
        RGNL = 9,
        [Display(Name = "امور مالیاتی")]
        TAX = 10,
    }
}