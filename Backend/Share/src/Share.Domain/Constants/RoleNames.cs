using System.ComponentModel;

namespace Share.Domain.Constants
{
    public class RoleNames
    {
        [Description("حداقل دسترسی")]
        public const string Authorize = "Authorize";
        [Description("ادمین")]
        public const string Admin = "Admin";
        [Description("مدیر واحد فناوری اطلاعات")]
        public const string ITAdmin = "ITAdmin";
        [Description("ادمین بازارگردان")]
        public const string MarketMakerAdmin = "MarketMakerAdmin";
        [Description("کاربر بازارگردان")]
        public const string MarketMakerUser = "MarketMakerUser";
        [Description("کارشناس بازارگردان")]
        public const string MarketMakerExpert = "MarketMakerExpert";
        [Description("رئیس اداره بازارگردان")]
        public const string MarketMakerOfficeBoss = "MarketMakerOfficeBoss";
        [Description("مدیر بازارگردان")]
        public const string MarketMakerManager = "MarketMakerManager";

        [Description("کارگزار بازار نقد")]
        public const string CashMarket = "CashMarket";
        [Description("کارشناس بازار نقد")]
        public const string CashMarketExpert = "CashMarketExpert";
        [Description("کارشناس مسئول بازار نقد")]
        public const string CashMarketSeniorExpert = "CashMarketSeniorExpert";
        [Description("رئیس اداره بازار نقد")]
        public const string CashMarketOfficeBoss = "CashMarketOfficeBoss";
        [Description("مدیر بازار نقد")]
        public const string CashMarketManager = "CashMarketManager";
        [Description("معاونت بازار نقد")]
        public const string CashMarketDeputy = "CashMarketDeputy";
        [Description("معاونت ناشران")]
        public const string CashMarketDeputyPublisher = "CashMarketDeputyPublisher";


        [Description("کارشناس مسئول پذیرش")]
        public const string KarshenasMasoulPaziresh = "KarshenasMasoulPaziresh";
        [Description("مدیر پذیرش")]
        public const string ModirPaziresh = "ModirPaziresh";
        [Description("معاون ناشران")]
        public const string MoavenatNasheran = "MoavenatNasheran";
        [Description("مدیر ناشران")]
        public const string ModirNasheran = "ModirNasheran";
        [Description("کارشناس شرکت مشاور")]
        public const string KarshenasSherkatMoshaver = "KarshenasSherkatMoshaver";
        [Description("مدیر عامل شرکت بورس")]
        public const string ModirAmel = "CEO";




    }
}
