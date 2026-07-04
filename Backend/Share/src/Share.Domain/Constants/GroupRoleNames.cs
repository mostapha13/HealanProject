using System.ComponentModel;

namespace Share.Domain.Constants
{
    public class GroupRoleNames
    {
        [Description("Admin Access")]
        public const string AdminAccess = RoleNames.Admin + "," + RoleNames.ITAdmin + "," + RoleNames.MarketMakerAdmin + "," + RoleNames.MarketMakerManager;
        [Description("MarketMakerUser_Get")]
        public const string MarketMakerUser_Get = RoleNames.Admin + "," + RoleNames.ITAdmin + "," + RoleNames.MarketMakerAdmin + "," + RoleNames.MarketMakerUser;
        [Description("MarketMakerUser_Post")]
        public const string MarketMakerUser_Post = RoleNames.MarketMakerUser;
        [Description("MarketMakerOrganization_Get")]
        public const string MarketMakerOrganization_Get = RoleNames.Admin + "," + RoleNames.ITAdmin + "," + RoleNames.MarketMakerAdmin + "," + RoleNames.MarketMakerExpert + "," + RoleNames.MarketMakerOfficeBoss + "," + RoleNames.MarketMakerManager;
        [Description("MarketMakerOrganization_Post")]
        public const string MarketMakerOrganization_Post = RoleNames.MarketMakerExpert + "," + RoleNames.MarketMakerOfficeBoss + "," + RoleNames.MarketMakerManager;
        [Description("MarketMakerGeneralView")]
        public const string MarketMakerGeneralView = RoleNames.Admin + "," + RoleNames.ITAdmin + "," + RoleNames.MarketMakerAdmin + "," + RoleNames.MarketMakerUser + "," + RoleNames.MarketMakerExpert + "," + RoleNames.MarketMakerOfficeBoss + "," + RoleNames.MarketMakerManager + "," + CashMarketUser_Get;
        [Description("MarketMakerGeneralPost")]
        public const string MarketMakerGeneralPost = RoleNames.MarketMakerUser + "," + RoleNames.MarketMakerExpert + "," + RoleNames.MarketMakerOfficeBoss + "," + RoleNames.MarketMakerManager;

        public const string CashMarketUser_Get = RoleNames.CashMarket + "," + RoleNames.CashMarketExpert + "," + RoleNames.CashMarketSeniorExpert + "," + RoleNames.CashMarketOfficeBoss + "," + RoleNames.CashMarketManager + "," + RoleNames.CashMarketDeputy + "," + RoleNames.CashMarketDeputyPublisher ;
        public const string CashMarketUser_WorkfolwProceed = RoleNames.CashMarketDeputy + "," + RoleNames.CashMarketDeputyPublisher + "," + RoleNames.CashMarketExpert + "," + RoleNames.CashMarketManager + "," + RoleNames.CashMarketOfficeBoss + "," + RoleNames.CashMarketSeniorExpert;
    }
}
