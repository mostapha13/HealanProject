namespace WorkFlow.Application.Common.Constant
{
    public static class ValidationMessages
    {

        public const string Public_YouMustLogin = "برای ادامه کار وارد سیستم شوید";

        public const string CantDeleteUserGroup = "گروه مورد نظر در بخش تعریف کاربران استفاده شده و قابل حذف نیست.";
        public const string GroupNameIsDuplicated = "گروهی با این نام قبلا در سیستم ایجاد شده است.";

        public const string GroupNameIsNotValid = "نام گروه معتبر نیست.";

        public const string FirstNameIsNotValid = "نام شخص معتبر نیست.";
        public const string LastNameIsNotValid = "نام خانوادگی معتبر نیست.";
        public const string LoginNotCreated = "خطا در ثبت کاربر";


        public const string UserGroupShouldHasValue = "اطلاعات گروه معتبر نیست.";
        public const string FundShouldHasValue = "اطلاعات صندوق معتبر نیست.";
        public const string PhoneNumberShouldHasValue = "شماره همراه وارد نشده است.";
        public const string PhoneNumberIsNotValid = "شماره همراه وارد شده معتبر نیست.";

        public const string CantDeleteFund = "صندوق مورد نظر در بخش تعریف کاربران استفاده شده و قابل حذف نیست.";
        public const string FundNameIsNotValid = "نام صندوق معتبر نیست.";
        public const string FundNameIsDuplicated = "صندوقی با این نام قبلا در سیستم ایجاد شده است.";


        public const string DenyReasonTitleIsNotValid = "عنوان علت رد معتبر نیست.";


        public const string InstrumentParameter_InstrumentShouldHasValue = "نماد انتخاب نشده است.";
        public const string InstrumentParameter_ParameterChangeTypeShouldHasValue = "نوع تغییر انتخاب نشده است.";
        public const string InstrumentParameter_MinValueShouldBeGreaterThanZero = "حداقل حجم معامله باید بزرگتر از صفر باشد.";
        public const string InstrumentParameter_ToleranceValueShouldBeGreaterThanZero = "دامنه مظنه باید بزرگتر از صفر باشد.";
        public const string InstrumentParameter_MaxOrderValueShouldBeGreaterThanZero = "سفارش انباشته باید بزرگتر از صفر باشد.";
        public const string InstrumentParameter_IsActiveShouldHasValue = "وضعیت فعال یا غیرفعال را مشخص کنید.";
        public const string InstrumentParameter_FromDateMustBeGreaterThanParameter = "تاریخ پارامتر برای نماد {0} باید بزرگتر از مقدار {1} باشد";
        public const string InstrumentParameter_OscillationShouldHasValue = "دامنه نوسان مشخص نشده است.";
        public const string InstrumentParameter_liquidityShouldHasValue = "نقد شوندگی مشخص نشده است.";
        public const string InstrumentParameter_ToDateShouldHasValue = "انتهای بازه زمانی تعیین نشده است.";

        public const string Investor_InvestorNameIsNotValid = "نام سرمایه گذار معتبر نیست";
        public const string Investor_InvestorCodeIsNotValid = "کد سرمابه گذار معتبر نیست.";
        public const string Investor_InvestorNameIsDuplicated = "سرمایه گذاری با این نام قبلا تعریف شده است.";
        public const string Investor_InvestorCodeIsDuplicated = "سرمایه گذاری با این کد قبلا تعریف شده است.";




        public const string Order_BringCashShouldBeGreaterThanZero= "مقدار آورده نقد باید بزرگتر از صفر باشد";
        public const string Order_BringShareShouldBeGreaterThanZero = "مقدار آورده سهم باید بزرگتر از صفر باشد";
        public const string Order_InstrumentShouldHasCorrectValue = "نماد انتخاب نشده است.";
        public const string Order_InstrumentParameterShouldHasCorrectValue = "برای نماد انتخاب شده باید پارامتر تعریف شده باشد.";
        public const string Order_StartDateShouldHasCorrectValue = "تاریخ شروع معتبر نیست";
        public const string Order_EndDateShouldHasCorrectValue = "تاریخ پایان معتبر نیست";
        public const string Order_OrderBrokersShouldHasValue = "هیچ کارگزاری انتخاب نشده است";
        public const string Order_OrderBrokersShouldNotGreaterThan2 = " نباید بیشتر از دو کارگزار انتخاب شده باشد";
        public const string Order_OrderFilesShouldHasValue = "تمامی مدارک باید بارگزاری شود";
        public const string Order_OrderInvestorsShouldHasValue = "هیچ سرمایه گزاری انتخاب نشده است.";

        public const string ConfirmForm_AllFileMustAcceptedOrRejected = "وضعیت تمامی فایل ها باید مشخص شده باشد";
        public const string ConfirmForm_AllFileMustAccepted = "برای تایید فرم، وضعیت همه فایل ها باید تایید شده باشد";
        public const string ConfirmForm_ItemNotInYourCartboard = "آیتم مورد نظر در کارتابل شخص دیگری است";


        public const string OrderExtending_BringCashShouldBeGreaterThanZero = "مقدار آورده نقد باید بزرگتر از صفر باشد";
        public const string OrderExtending_BringShareShouldBeGreaterThanZero = "مقدار آورده سهم باید بزرگتر از صفر باشد";
        public const string OrderExtending_InstrumentShouldHasCorrectValue = "نماد انتخاب نشده است.";
        public const string OrderExtending_StartDateShouldHasCorrectValue = "تاریخ شروع معتبر نیست";
        public const string OrderExtending_EndDateShouldHasCorrectValue = "تاریخ پایان معتبر نیست";
        public const string OrderExtending_OrderBrokersShouldHasValue = "هیچ کارگزاری انتخاب نشده است";
        public const string OrderExtending_OrderBrokersShouldNotGreaterThan2 = " نباید بیشتر از دو کارگزار انتخاب شده باشد";
        public const string OrderExtending_OrderFilesShouldHasValue = "تمامی مدارک باید بارگزاری شود";
        public const string OrderExtending_OrderInvestorsShouldHasValue = "هیچ سرمایه گزاری انتخاب نشده است.";
        public const string OrderExtending_EndDateNotMathWithSetting = "تاریخ پایان تمدید بازارگردانی طبق تنظیمات، باید حداکتر {0} روز قبل از پایان دوره بازارگردانی باشد";



        public const string SaveInstructionFile_FormIdIsNotValid = "پارامتر ارسالی فرم صحیح نیست";



        public const string AccessRequest_FundNameIsNotValid = "نام صندوق معتبر نیست.";
        public const string AccessRequest_FirstNameIsNotValid = "نام نماینده معتبر نیست.";
        public const string AccessRequest_LastNameIsNotValid = "نام خانوادگی نماینده معتبر نیست.";
        public const string AccessRequest_WorkFlowManagerPhoneNumberNotValid = "شماره همراه مدیر صندوق معتبر نیست.";
        public const string AccessRequest_TrusteeNameIsNotValid = "نام متولی معتبر نیست.";
        public const string AccessRequest_FundManagerNameIsNotValid = "نام مدیر صندوق معتبر نیست.";
        public const string AccessRequest_AuditorNameIsNotValid = "نام حسابرس معتبر نیست.";
        public const string AccessRequest_RegisteredCapitalIsNotValid = "سرمایه ثبت شده معتبر نیست.";



        public const string QuitReasons_CantDeleteQuitReason = "این دلیل انصراف قبلا در بخش انصراف بازارگردان استفاده شده و قابل حذف نیست";
        public const string QuitReasons_QuitReasonNameIsNotValid = "عنوان دلیل انصراف صحیح نیست";
        public const string QuitReasons_QuitReasonNameIsDuplicated = "دلیل انصراف با این همین عنوان قبلا در سیستم ایجاد شده است.";

        public const string QuitOrder_OrderParentIdMusHasValue = "درخواست بازارگردانی قبلی که قصد انصراف از آن را دارید تعیین نشده است";
        public const string QuitOrder_QuitReasonIdMusHasValue = "دلیل انصراف مشخص نشده است";
        public const string QuitOrder_OrderFilesShouldHasValue = "تمامی مدارک باید بارگزاری شود";



        public const string Setting_KeyIsNotValid = "شناسه معتبر نیست.";
        public const string Setting_NameIsNotValid = "نام تنظیمات معتبر نیست.";






        public const string InstrumentParameterTemp_MinValueShouldBeGreaterThanZero = "حداقل حجم معامله باید بزرگتر از صفر باشد.";
        public const string InstrumentParameterTemp_ToleranceValueShouldBeGreaterThanZero = "دامنه مظنه باید بزرگتر از صفر باشد.";
        public const string InstrumentParameterTemp_MaxOrderValueShouldBeGreaterThanZero = "سفارش انباشته باید بزرگتر از صفر باشد.";
        public const string InstrumentParameterTemp_FromDateMustBeGreaterThanParameter = "تاریخ پارامتر برای این نماد باید بزرگتر از مقدار {0} باشد";
        public const string InstrumentParameterTemp_OscillationShouldHasValue = "دامنه نوسان مشخص نشده است.";
        public const string InstrumentParameterTemp_liquidityShouldHasValue = "نقد شوندگی مشخص نشده است.";
    }
}
