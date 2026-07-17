using Healan.Domain.Doctors.Entities;

namespace Healan.Domain.Booking.Entities;

/// <summary>قالب هفتگی ساعات حضور پزشک (مثلاً شنبه ۱۷–۲۱).</summary>
public class DoctorScheduleTemplate
{
    public long DoctorScheduleTemplateId { get; set; }
    public long DoctorId { get; set; }
    /// <summary>DayOfWeek دات‌نت: Sunday=0 … Saturday=6</summary>
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int VisitDurationMinutes { get; set; } = 30;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Doctor Doctor { get; set; } = null!;
}
