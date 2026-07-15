namespace Healan.Application.Common.ClinicAccess;

public enum ClinicDataAccessMode
{
    /// <summary>ادمین اصلی — همه داده‌ها</summary>
    All = 0,
    /// <summary>پزشک — فقط ویزیت‌ها/بیماران خودش</summary>
    ByDoctor = 1,
    /// <summary>منشی/پذیرش/حسابدار کلینیک — نوبت‌های پزشکان همان مرکز</summary>
    ByCompany = 2,
    /// <summary>بدون دسترسی داده‌ای</summary>
    None = 3,
}

public sealed class ClinicAccessScope
{
    public Guid IdentityUserId { get; init; }
    public long? HealanUserId { get; init; }
    public long? CompanyId { get; init; }
    public long? DoctorId { get; init; }
    public IReadOnlyList<string> RoleNames { get; init; } = Array.Empty<string>();
    public ClinicDataAccessMode Mode { get; init; }

    public bool IsAdmin => Mode == ClinicDataAccessMode.All;
    public bool IsDoctorScoped => Mode == ClinicDataAccessMode.ByDoctor;
    public bool IsCompanyScoped => Mode == ClinicDataAccessMode.ByCompany;
}
