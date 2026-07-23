using Share.Domain.Constants;

namespace IdentityServer.Domain.Data;

/// <summary>
/// نقش‌ها و منوهای دسترسی کلینیک Healan (مطب متخصص قلب).
/// </summary>
public static class HealanClinicAccess
{
    public const string SecretaryRole = "Secretary";
    public const string DoctorRole = "Doctor";
    public const string AccountantRole = "Accountant";
    public const string ContentProducerRole = "ContentProducer";
    /// <summary>نقش پورتال عمومی — بدون منوی کلینیک؛ با نقش‌های کلینیک قابل جمع است.</summary>
    public const string SiteUserRole = "SiteUser";
    /// <summary>نقش بیمار پورتال — منوهای /patient و چت/رزرو از سایت عمومی.</summary>
    public const string PatientRole = "Patient";
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
        public const int PortalSiteSettings = 5145;
        public const int PortalSeo = 5146;
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
        public const int PortalRagLogs = 5132;
        public const int BookingFolder = 5133;
        public const int BookingSchedules = 5134;
        public const int BookingReservations = 5135;
        public const int PatientPortalFolder = 5136;
        public const int PatientHistory = 5137;
        public const int PatientBloodPressure = 5138;
        public const int PatientMedications = 5139;
        public const int PatientAssistant = 5140;
        public const int PatientBooking = 5141;
        public const int ClinicBloodPressure = 5142;
        public const int SmsFolder = 5143;
        public const int ReportsFolder = 5144;
    }

    /// <summary>ادمین — دسترسی کامل به همه بخش‌های سامانه (فولدرها + زیرمنوها).</summary>
    public static readonly int[] AdminMenuIds =
    {
        5101, 5102, 5103, 5104, 5105, 5106, 5107, 5108, 5109, 5110, 5111, 5112, 5113,
        5114, 5115, 5116, 5117, 5118, 5119, 5120, 5121, 5122, 5123, 5124, 5125, 5126, 5127, 5128,
        5129, 5130, 5131, 5132, 5133, 5134, 5135,
        5136, 5137, 5138, 5139, 5140, 5141, 5142, 5143, 5144, 5145, 5146,
    };

    /// <summary>منشی — پذیرش، ثبت بیمار/بیمه، نوبت، صف و پرداخت.</summary>
    public static readonly int[] SecretaryMenuIds =
    {
        Menus.Dashboard, Menus.Queue, Menus.Appointments, Menus.Patients,
        Menus.ClinicBloodPressure,
        Menus.Insurance, Menus.Services, Menus.MedicalFees,
        Menus.PortalContent, Menus.PortalSiteSettings, Menus.PortalSeo, Menus.PortalReviews, Menus.PortalBlog, Menus.PortalRag,
        Menus.AssistantSettings, Menus.PortalRagLogs,
        Menus.BookingFolder, Menus.BookingSchedules, Menus.BookingReservations,
    };

    /// <summary>پزشک — ویزیت، نسخه، سوابق و صف بیماران.</summary>
    public static readonly int[] DoctorMenuIds =
    {
        Menus.Dashboard, Menus.Queue, Menus.Appointments, Menus.Patients,
        Menus.ClinicBloodPressure, Menus.Prescriptions,
    };

    /// <summary>حسابدار — گزارش مالی، تعرفه، پرداخت‌ها.</summary>
    public static readonly int[] AccountantMenuIds =
    {
        Menus.Dashboard, Menus.Appointments, Menus.Patients, Menus.MedicalFees,
        Menus.ReportsFolder, Menus.Reports,
        Menus.SmsFolder, Menus.SmsOutbox, Menus.SmsSettings,
    };

    /// <summary>تولیدکننده محتوا — محتوای سایت، بلاگ و دانش/گفتگوهای RAG.</summary>
    public static readonly int[] ContentProducerMenuIds =
    {
        Menus.Dashboard, Menus.PortalContent, Menus.PortalSiteSettings, Menus.PortalSeo, Menus.PortalReviews,
        Menus.PortalBlog, Menus.PortalBlogAdd, Menus.PortalBlogEdit,
        Menus.PortalBlogDelete, Menus.PortalBlogPublish,
        Menus.PortalRag, Menus.PortalRagLogs,
    };

    /// <summary>منوهای ناحیه بیمار روی سایت عمومی.</summary>
    public static readonly int[] PatientPortalMenuIds =
    {
        Menus.PatientPortalFolder,
        Menus.PatientHistory,
        Menus.PatientBloodPressure,
        Menus.PatientMedications,
        Menus.PatientAssistant,
        Menus.PatientBooking,
    };

    public static readonly string[] ClinicSystemRoles =
    {
        ConstUserInfo.AdminRole,
        SecretaryRole,
        DoctorRole,
        AccountantRole,
        ContentProducerRole,
        SiteUserRole,
        PatientRole,
    };
}
