using Share.Domain.Entities;

namespace Healan.Domain.Patients.Entities;

public class PatientMedicationReminder : AuditableEntity
{
    public long PatientMedicationReminderId { get; set; }
    public long PatientId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string? Dose { get; set; }
    /// <summary>فاصله مصرف به ساعت: ۴، ۶، ۸، ۱۰، ۱۲، ۲۴</summary>
    public int IntervalHours { get; set; }
    /// <summary>ساعت اولین مصرف</summary>
    public TimeSpan FirstDoseTime { get; set; }
    /// <summary>ساعات محاسبه‌شده (مثلاً 08:00,16:00,00:00+1)</summary>
    public string TimesOfDay { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Patient Patient { get; set; } = null!;
}
