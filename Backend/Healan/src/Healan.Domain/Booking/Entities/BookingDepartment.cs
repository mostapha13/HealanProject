using Healan.Domain.Doctors.Enums;
using Healan.Domain.PublicInfos.Entities;

namespace Healan.Domain.Booking.Entities;

/// <summary>دپارتمان قابل رزرو؛ مستقل از بخش‌های حسابداری/پذیرش سامانه.</summary>
public class BookingDepartment
{
    public BookingDepartment() => Services = new List<ServiceType>();

    public long BookingDepartmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public MedicalGroupTypeId MedicalGroupTypeId { get; set; }
    public int SortOrder { get; set; }
    public bool SupportsComplementaryInsurance { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<ServiceType> Services { get; set; }
}
