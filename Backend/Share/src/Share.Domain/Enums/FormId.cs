using System.ComponentModel.DataAnnotations;

namespace Share.Domain.Enums
{
    public enum FormId : int
    {
        [Display(Name = "جزییات درخواست بازارگردانی")]
        Order = 1,
        [Display(Name = "عدم تایید درخواست بازارگردانی")]
        OrderReject = 2,
        [Display(Name = "عدم تایید شروع درخواست بازارگردانی")]
        OrderRejectStart = 3,
        [Display(Name = "جزییات تمدید درخواست بازارگردانی")]
        ExtendingOrder = 4,
        [Display(Name = "عدم تایید تمدید درخواست بازارگردانی")]
        ExtendingOrderReject = 5,
        [Display(Name = "عدم تایید شروع تمدید درخواست بازارگردانی")]
        ExtendingOrderRejectStart = 6,
        [Display(Name = "درخواست تایید پروفایل مشتری")]
        MarketMakerAccessRequest = 7,
        [Display(Name = "عدم تایید درخواست تایید پروفایل مشتری")]
        MarketMakerAccessRequestReject = 8,


        [Display(Name = "جزییات درخواست انصراف از بازارگردانی")]
        OrderQuit = 9,
        [Display(Name = "عدم تایید درخواست انصراف از بازارگردانی")]
        OrderQuitReject = 10,
        [Display(Name = "عدم تایید شروع درخواست انصراف از بازارگردانی")]
        OrderQuitRejectStart = 11,

        [Display(Name = "جزییات درخواست ارسال صورت حساب")]
        FinancialStatements = 12,
        [Display(Name = "عدم تایید درخواست ارسال صورت حساب")]
        FinancialStatementsReject = 13,
        [Display(Name = "عدم تایید شروع درخواست ارسال صورت حساب")]
        FinancialStatementsRejectStart = 14,
        [Display(Name = "جهت اطلاع تایید درخواست")]
        FinancialStatementsNotice = 15,


        [Display(Name = "عدم تایید درخواست بلوک ")]
        TransferBlockReject = 16,
        [Display(Name = "جزئیات درخواست بلوک")]
        TransferBlock = 17,
        [Display(Name = "تغییر وضعیت معامله بلوک")]
        TransferBlockChangeStatus = 18,
        [Display(Name = "عدم تایید شروع درخواست بلوک")]
        TransferBlockRejectStart = 19,


        [Display(Name = "عدم تایید شروع درخواست معامله خارج از ساعت")]
        TransferStockRejectStart = 20,
        [Display(Name = "جزئیات درخواست خارج از ساعت")]
        TransferStock = 21,
        [Display(Name = "مهلت ارسال مدارک تکمیلی خارج از ساعت")]
        TransferStockDeadlineTime = 22,
        [Display(Name = "ارسال مدارک تکمیلی خارج از ساعت")]
        TransferStockDeadlineSendFile = 23,
        [Display(Name = "بررسی و تایید مدارک تکمیلی")]
        TransferStockCheckDocument = 24,
        [Display(Name = "عدم تایید معامله خارج از ساعت")]
        TransferStockReject = 25,
        [Display(Name = "عدم تایید بررسی و تایید مدارک تکمیلی")]
        TransferStockRejectDocument = 26,


        [Display(Name = "عدم تایید درخواست عرضه اولیه")]
        InitialSupplyReject = 28,
        [Display(Name = "جزئیات درخواست عرضه اولیه")]
        InitialSupply = 29,
        [Display(Name = "دانلود اطلاعیه عرضه اولیه")]
        InitialSupplyDownload = 30,
        [Display(Name = "عدم تایید شروع درخواست عرضه اولیه")]
        InitialSupplyRejectStart = 31,


        [Display(Name = "جزئیات درخواست فروش عمده کارشناس")]
        WholesaleDetaildExpert = 32,
        [Display(Name = "جزئیات درخواست فروش عمده ")]
        Wholesale = 33,
        [Display(Name = "انتشار اطلاعیه فروش عمده")]
        WholesaleDownload = 34,
        [Display(Name = "عدم تایید شروع درخواست فروش عمده")]
        WholesaleRejectStart = 35,
        [Display(Name = "عدم تایید درخواست فروش عمده")]
        WholesaleReject = 36,


        [Display(Name = "جزییات درخواست تغییر پارامتر")]
        OrderCommitmentIncDec_Order = 37,
        [Display(Name = "تعیین مهلت درخواست تغییر پارامتر")]
        OrderCommitmentIncDec_DateDefine = 38,
        [Display(Name = "عدم تایید درخواست تغییر پارامتر")]
        OrderCommitmentIncDec_OrderReject = 39,
        [Display(Name = "عدم تایید شروع درخواست تغییر پارامتر")]
        OrderCommitmentIncDec_OrderRejectStart = 40,



        [Display(Name = "جزییات درخواست تغییر کارگزار")]
        ChangeBroker_Order = 41,
        [Display(Name = "اختتام درخواست تغییر کارگزار")]
        ChangeBroker_FinalConfirm = 42,
        [Display(Name = "عدم تایید درخواست تغییر کارگزار")]
        ChangeBroker_OrderReject = 43,
        [Display(Name = "عدم تایید شروع درخواست تغییر کارگزار")]
        ChangeBroker_OrderRejectStart = 44,

    }
}
