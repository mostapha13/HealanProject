using Healan.Domain.Doctors.Entities;

namespace Healan.Domain.Booking.Entities;

/// <summary>استثنا برای یک تاریخ خاص: تعطیل یا ساعات جایگزین.</summary>
public class DoctorScheduleException
{
    public long DoctorScheduleExceptionId { get; set; }
    public long DoctorId { get; set; }
    public DateOnly Date { get; set; }
    /// <summary>اگر true باشد آن روز تعطیل است و اسلات تولید نمی‌شود.</summary>
    public bool IsClosed { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public int? VisitDurationMinutes { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Doctor Doctor { get; set; } = null!;
}
