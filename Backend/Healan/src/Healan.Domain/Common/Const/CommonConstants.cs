namespace Healan.Domain.Common.Const
{
    public static class CommonConstants
    {
        public const int AccessSave = 2136;
        public const int AccessAction = 2138;
        public const int AccessSignature = 2139;
    }

    public static class HealanRoles
    {
        public const string AdvicerCompany = "AdvicerCompany";
        public const string AdmissionsExpert = "Admissions-Expert";
        public const string AdmissionsBoardMember = "AdmissionsBoardMember";
        public const string FormerAdmissionsBoardMember = "FormerAdmissionsBoardMember";
        public const string Financial = "Financial";
        public const string HealanManager = "HealanManager";
        public const string HealanDeputy = "HealanDeputy";
        public const string Antimoney = "Antimoney";

    }

    public static class StringConstants
    {
        public const string NotAccess = "دسترسی ندارید.";

        public const string DossierUserIsIncorrect = "فقط کارشناس پرونده امکان تایید درخواست را دارد.";
        public const string ServiceFeeHasActive = "این سرویس دارای تعرفه فعال می باشد..";
        public const string InsuranceContractHasActive = "این شرکت دارای قرارداد فعال می باشد.";
    }
}
