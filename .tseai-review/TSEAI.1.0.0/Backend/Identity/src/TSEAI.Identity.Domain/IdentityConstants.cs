namespace TSEAI.Identity.Domain;
public static class IdentityConstants
{
    public static class Roles
    {
        public const string User = "User";
        public const string Admin = "Admin";
        public const string SuperAdmin = "SuperAdmin";
    }
    public static class Permissions
    {
        public const string ChatAsk = "Chat.Ask";
        public const string FilterCreate = "Filter.Create";
        public const string FilterSave = "Filter.Save";
        public const string FilterExport = "Filter.Export";
        public const string AlertCreate = "Alert.Create";
        public const string AdminSettings = "Admin.Settings";
        public const string AdminUsers = "Admin.Users";
        public const string AdminUsage = "Admin.Usage";
        public static readonly string[] All = [ChatAsk, FilterCreate, FilterSave, FilterExport, AlertCreate, AdminSettings, AdminUsers, AdminUsage];
    }
}
