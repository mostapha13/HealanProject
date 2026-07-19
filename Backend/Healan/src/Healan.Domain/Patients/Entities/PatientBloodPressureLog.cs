using Healan.Domain.Patients.Enums;
using Share.Domain.Entities;

namespace Healan.Domain.Patients.Entities;

public class PatientBloodPressureLog : AuditableEntity
{
    public long PatientBloodPressureLogId { get; set; }
    public long PatientId { get; set; }
    public int Systolic { get; set; }
    public int Diastolic { get; set; }
    public int? Pulse { get; set; }
    public DateTime MeasuredAt { get; set; }
    /// <summary>صبح / ظهر / شب</summary>
    public BloodPressurePeriod? PeriodOfDay { get; set; }
    /// <summary>ساعت اختیاری اندازه‌گیری (مثلاً ۰۸:۰۰)</summary>
    public TimeSpan? MeasuredTime { get; set; }
    public string? Note { get; set; }

    public Patient Patient { get; set; } = null!;
}
