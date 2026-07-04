using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Views.Enums;

public enum MarketMakerFileTypeId : byte
{
    [Display(Name = "اعلام زمان آمادگی شروع فعالیت")]
    ActivityAnnouncing = 1,
    [Display(Name = "تقاضانامه بازارگردانی")]
    MarketingApplication = 2,
    [Display(Name = "قرارداد / متمم قرارداد بازارگردانی")]
    MarketingContract = 3,
    [Display(Name = "آخرین صورت جلسه مجمع صندوق")]
    LastMeeting = 4,



    [Display(Name = "نامه درخواست انصراف بازارگردان")]
    CancellationRequest = 6,
    [Display(Name = "نامه موافقت تامین کننده منابع - مستندات درخواست تامین منابع")]
    PublisherConsent = 7,


    [Display(Name = "انتخاب مدیر صندوق ")]
    FundManagerChoosingLetter = 9,
    [Display(Name = "درخواست عضویت")]
    MembershipRequestLetter = 10,
    [Display(Name = "مجوز شروع عملیات بازارگردانی")]
    ActivityStartLicense = 11,
    [Display(Name = "امیدنامه")]
    HopeLetter = 12,
    [Display(Name = "تغییرات")]
    Changes = 13,

    /// <summary>
    /// نامه درخواست
    /// OrderCommitmentIncDec
    /// </summary>
    [Display(Name = "نامه درخواست")]
    OrderCommitmentIncDec_RequestLetter = 14,

    /// <summary>
    /// ترازنامه
    /// </summary>
    [Display(Name = "ترازنامه")]
    OrderCommitmentIncDec_BalanceSheet = 15,
    /// <summary>
    /// مکاتبات
    /// </summary>
    [Display(Name = "مکاتبات")]
    OrderCommitmentIncDec_Correspondence = 16,
    /// <summary>
    /// صورت جلسه مجمع
    /// </summary>
    [Display(Name = "صورت جلسه مجمع")]
    OrderCommitmentIncDec_Meeting = 17,
    /// <summary>
    /// سایر موارد
    /// </summary>
    [Display(Name = "سایر موارد")]
    OrderCommitmentIncDec_Other = 18,



    /// <summary>
    /// نامه درخواست
    /// </summary>
    [Display(Name = "نامه درخواست")]
    OrderChangeBroker_RequestLetter = 19,
    /// <summary>
    /// نامه قبولی سمت کارگزار جدید
    /// </summary>
    [Display(Name = "نامه قبولی سمت کارگزار جدید")]
    OrderChangeBroker_AcceptanceLetter = 20,
    /// <summary>
    /// سایر موارد
    /// </summary>
    [Display(Name = "سایر موارد")]
    OrderChangeBroker_Other = 21

}