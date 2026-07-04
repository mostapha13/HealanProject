using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Enums
{
    public enum WorkFlowTypeId : int
    {
        [Display(Name = "شروع بازارگردانی")]
        MarketMakerStart = 1,
        [Display(Name = "تمدید بازارگردانی")]
        MarketMakerExtending = 2,
        [Display(Name = "درخواست تایید پروفایل مشتری")]
        MarketMakerAccessRequest = 3,
        [Display(Name = "درخواست انصراف از بازارگردانی")]
        MarketMakerQuitOrderRequest = 4,
        [Display(Name = "درخواست ارسال صورت حساب")]
        FinancialStatementsRequest = 5,
        [Display(Name = "درخواست معامله بلوک")]
        TransferBlock = 6,
        [Display(Name = "درخواست عرضه اولیه")]
        InitialSupply = 7,
        [Display(Name = "درخواست معامله خارج از ساعت")]
        TransferStock = 8,
        [Display(Name = "فروش عمده")]
        Wholesale = 9,
        [Display(Name = "خرید عمده")]
        WholesaleBuyer =10,
        [Display(Name = "قطعیت فروش")]
        WholesaleBuyerCertainty = 11,
        [Display(Name = "انصراف از فروش")]
        CancellationWholesale = 12,
        [Display(Name ="انصراف از خرید")]
        CancellationWholesaleBuy=13,

        [Display(Name = "تغییرات بازارگردانی")]
        OrderCommitmentIncDecs =14,
        [Display(Name = "تغییر کارگزار")]
        OrderChangeBrokers = 15,
    }
}
