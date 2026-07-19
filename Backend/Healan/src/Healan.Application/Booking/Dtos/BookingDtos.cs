using Healan.Domain.Booking.Enums;

namespace Healan.Application.Booking.Dtos;

public class ScheduleTemplateDto
{
    public long DoctorScheduleTemplateId { get; set; }
    public long DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = "17:00";
    public string EndTime { get; set; } = "21:00";
    public int VisitDurationMinutes { get; set; } = 30;
    public bool IsActive { get; set; } = true;
}

public class ScheduleExceptionDto
{
    public long DoctorScheduleExceptionId { get; set; }
    public long DoctorId { get; set; }
    public string Date { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public int? VisitDurationMinutes { get; set; }
    public string? Note { get; set; }
}

public class AppointmentSlotDto
{
    public long AppointmentSlotId { get; set; }
    public long DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public AppointmentSlotStatus Status { get; set; }
    public AppointmentSlotSource Source { get; set; }
    public string? Note { get; set; }
    public AppointmentBookingDto? Booking { get; set; }
}

public class AppointmentBookingDto
{
    public long AppointmentBookingId { get; set; }
    public long AppointmentSlotId { get; set; }
    public long DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public long? PatientId { get; set; }
    public string NationalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Note { get; set; }
    /// <summary>Numeric status for stable portal/clinic clients (1=Booked … 5=NoShow).</summary>
    public byte Status { get; set; }
    /// <summary>عنوان فارسی وضعیت رزرو.</summary>
    public string? StatusTitle { get; set; }
    public long? AppointmentId { get; set; }
    public bool BookedByStaff { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public List<long> RequestedServiceTypeIds { get; set; } = new();
    public List<string> RequestedServiceTitles { get; set; } = new();
}

public class BookingAcceptResultDto
{
    public long AppointmentBookingId { get; set; }
    public long? PatientId { get; set; }
    public long DoctorId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Note { get; set; }
    public List<long> SuggestedServiceTypeIds { get; set; } = new();
    /// <summary>مسیر پذیرش موجود در کلینیک برای پیش‌پر کردن فرم.</summary>
    public string RegisterPath { get; set; } = "/appointments";
}

public class PortalDoctorDto
{
    public long DoctorId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}

public class PortalOpenSlotDto
{
    public long AppointmentSlotId { get; set; }
    public long DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
}

public class BookingLookupPatientDto
{
    public bool Found { get; set; }
    public long? PatientId { get; set; }
    public string NationalCode { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
}
