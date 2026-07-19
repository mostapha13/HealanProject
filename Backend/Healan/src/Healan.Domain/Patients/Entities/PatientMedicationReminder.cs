using Share.Domain.Entities;

namespace Healan.Domain.Patients.Entities;

public class PatientMedicationReminder : AuditableEntity
{
    public long PatientMedicationReminderId { get; set; }
    public long PatientId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string? Dose { get; set; }
    /// <summary>Comma-separated HH:mm times (local), e.g. 08:00,14:00,20:00</summary>
    public string TimesOfDay { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Patient Patient { get; set; } = null!;
}
