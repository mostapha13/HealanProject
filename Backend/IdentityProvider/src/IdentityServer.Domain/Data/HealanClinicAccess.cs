namespace IdentityServer.Domain.Data;

/// <summary>
/// نقش‌ها و منوهای دسترسی کلینیک Healan (مطب متخصص قلب).
/// </summary>
public static class HealanClinicAccess
{
    public const string SecretaryRole = "Secretary";
    public const string DoctorRole = "Doctor";
    public const string AccountantRole = "Accountant";
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
    }

    /// <summary>ادمین — دسترسی کامل به همه بخش‌های سامانه.</summary>
    public static readonly int[] AdminMenuIds =
    {
        Menus.Dashboard, Menus.Queue, Menus.Appointments, Menus.Patients, Menus.Doctors,
        Menus.Prescriptions, Menus.Companies, Menus.Insurance, Menus.Services, Menus.MedicalFees,
        Menus.UserDefine, Menus.AccessDefine, Menus.AccessRoleAssign, Menus.Reports,
        Menus.Workflow, Menus.Signature, Menus.PortalContent, Menus.PortalReviews, Menus.PortalBlog, Menus.PortalRag,
    };

    /// <summary>منشی — پذیرش، ثبت بیمار/بیمه، نوبت، صف و پرداخت.</summary>
    public static readonly int[] SecretaryMenuIds =
    {
        Menus.Dashboard, Menus.Queue, Menus.Appointments, Menus.Patients,
        Menus.Insurance, Menus.Services, Menus.MedicalFees,
        Menus.PortalContent, Menus.PortalReviews, Menus.PortalBlog, Menus.PortalRag,
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
    };

    public static readonly string[] ClinicSystemRoles =
    {
        ConstUserInfo.AdminRole,
        SecretaryRole,
        DoctorRole,
        AccountantRole,
    };
}
