using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum WorkFlowUserGroupId : int
    {
        [Display(Name = "ابزار نوین")]
        NewInstrument = 2,
        [Display(Name = "کارگزار بازار سهام")]
        MarketMaker = 8,
        [Display(Name = "کارشناس بازار سهام")]
        MarketMakerExpert = 9,
        [Display(Name = "مدیر بازار سهام")]
        MarketMakerManager = 12,
        [Display(Name = "معاونت بازار سهام")]
        MarketMakerDeputy = 13,
        [Display(Name = "معاونت ناشران")]
        PublisherDeputy = 14,
        [Display(Name = "بیمار")]
        Patient = 15,
        [Display(Name = "پزشک")]
        Doctor =16,
        [Display(Name = "کاربر عمومی")]
        Healan=17

    }
}
