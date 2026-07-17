using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.UserAccessModels
{
    public enum UserAccesRoleId : int
    {
        [Display(Name = "ادمین")]
        Admin = 1,
        [Display(Name = "حداقل دسترسی")]
        MarketMakerAuthorize = 2,
        [Display(Name = "مدیر واحد فناوری اطلاعات")]
        ITAdmin = 3,
        [Display(Name = "ادمین بازارگردان")]
        MarketMakerAdmin = 4,
        [Display(Name = "کاربر بازارگردان")]
        MarketMakerUser = 5,
        [Display(Name = "کارشناس بازارگردان")]
        MarketMakerExpert = 6,
        [Display(Name = "رئیس اداره بازارگردان")]
        MarketMakerOfficeBoss = 7,
        [Display(Name = "مدیر بازارگردان")]
        MarketMakerManager = 8,

        [Display(Name = "مدیر روابط عمومی")]
        PublicRelation = 9,
        [Display(Name = "پذیرش")]
        Healan = 10,
        [Display(Name = "ناشران")]
        Publishers = 11,
        [Display(Name = "عملیات بازار")]
        MarketOperaion = 12,
        [Display(Name = "نظارت بازار")]
        MarketSupervision = 13,
        [Display(Name = "کارشناس مالی")]
        TaxUser = 14,
        [Display(Name = "مدیر مالی")]
        TaxAdmin = 15,
        [Display(Name = "کارگزار بازار نقد")]
        CashMarket = 16,
        [Display(Name = "کارشناس بازار نقد")]
        CashMarketExpert = 17,
        [Display(Name = "کارشناس مسئول بازار نقد")]
        CashMarketSeniorExpert = 18,
        [Display(Name = "رئیس اداره بازار نقد")]
        CashMarketOfficeBoss = 19,
        [Display(Name = "مدیر بازار نقد")]
        CashMarketManager = 20,
        [Display(Name = "معاونت بازار نقد")]
        CashMarketDeputy = 21,
        [Display(Name = "معاونت ناشران")]
        CashMarketDeputyPublisher = 22,
        [Display(Name = "ادمین تالار")]
        RegionHallAdmin = 23,
        [Display(Name = "مدیر تالار")]
        RegionHallManager = 24,
        [Display(Name = "مدیر تالار")]
        RegionHallFieldWorker = 25,
        [Display(Name = "کارشناس روابط عمومی")]
        PublicRelationExpert = 26,
        [Display(Name = "منشی")]
        Secretary = 27,
        [Display(Name = "پزشک")]
        Doctor = 28,
        [Display(Name = "حسابدار")]
        Accountant = 29,
        [Display(Name = "کاربر سایت")]
        SiteUser = 30,
    }
}
