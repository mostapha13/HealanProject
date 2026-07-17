namespace IdentityServer.Domain.Data;

/// <summary>
/// نقش‌ها و منوهای دسترسی کلینیک Healan (مطب متخصص قلب).
/// </summary>
public static class HealanClinicAccess
{
    public const string SecretaryRole = "Secretary";
    public const string DoctorRole = "Doctor";
    public const string AccountantRole = "Accountant";
    /// <summary>نقش پورتال عمومی — بدون منوی کلینیک؛ با نقش‌های کلینیک قابل جمع است.</summary>
    public const string SiteUserRole = "SiteUser";
    public const string ClinicDefaultPassword = "aA@123456";

    public static class Menus
    {
        public const int Dashboard = 5101;
        public const int Queue = 5103;
        public const int Appointments = 5104;
        public const int Patients = 5105;
        public const int Doctors = 5106;
        public const int Prescriptions = 5107;
        public const int Companies = 5109;
        public const int Insurance = 5110;
        public const int Services = 5111;
        public const int MedicalFees = 5112;
        public const int UserDefine = 5114;
        public const int AccessDefine = 5115;
        public const int AccessRoleAssign = 5116;
        public const int Reports = 5117;
        public const int Workflow = 5118;
        public const int Signature = 5119;
        public const int PortalContent = 5121;
        public const int PortalReviews = 5122;
        public const int PortalBlog = 5123;
        public const int PortalBlogAdd = 5124;
        public const int PortalBlogEdit = 5125;
        public const int PortalBlogDelete = 5126;
        public const int PortalBlogPublish = 5127;
        public const int PortalRag = 5128;
        public const int SmsOutbox = 5129;
        public const int SmsSettings = 5130;
        public const int AssistantSettings = 5131;
    }

    /// <summary>ادمین — دسترسی کامل به همه بخش‌های سامانه (فولدرها + زیرمنوها).</summary>
    public static readonly int[] AdminMenuIds =
    {
        5101, 5102, 5103, 5104, 5105, 5106, 5107, 5108, 5109, 5110, 5111, 5112, 5113,
        5114, 5115, 5116, 5117, 5118, 5119, 5120, 5121, 5122, 5123, 5124, 5125, 5126, 5127, 5128,
        5129, 5130, 5131,
    };

    /// <summary>منشی — پذیرش، ثبت بیمار/بیمه، نوبت، صف و پرداخت.</summary>
    public static readonly int[] SecretaryMenuIds =
    {
        Menus.Dashboard, Menus.Queue, Menus.Appointments, Menus.Patients,
        Menus.Insurance, Menus.Services, Menus.MedicalFees,
        Menus.PortalContent, Menus.PortalReviews, Menus.PortalBlog, Menus.PortalRag,
        Menus.AssistantSettings,
    };

    /// <summary>پزشک — ویزیت، نسخه، سوابق و صف بیماران.</summary>
    public static readonly int[] DoctorMenuIds =
    {
        Menus.Dashboard, Menus.Queue, Menus.Appointments, Menus.Patients, Menus.Prescriptions,
    };

    /// <summary>حسابدار — گزارش مالی، تعرفه، پرداخت‌ها.</summary>
    public static readonly int[] AccountantMenuIds =
    {
        Menus.Dashboard, Menus.Appointments, Menus.Patients, Menus.MedicalFees, Menus.Reports,
        Menus.SmsOutbox, Menus.SmsSettings,
    };

    public static readonly string[] ClinicSystemRoles =
    {
        ConstUserInfo.AdminRole,
        SecretaryRole,
        DoctorRole,
        AccountantRole,
    };
}
