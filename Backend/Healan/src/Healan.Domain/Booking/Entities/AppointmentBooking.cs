using Healan.Domain.Appointments.Entities;
using Healan.Domain.Booking.Enums;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Patients.Entities;
using Healan.Domain.PublicInfos.Entities;

namespace Healan.Domain.Booking.Entities;

public class AppointmentBooking
{
    public AppointmentBooking()
    {
        RequestedServices = new List<ServiceType>();
    }

    public long AppointmentBookingId { get; set; }
    public long AppointmentSlotId { get; set; }
    public long DoctorId { get; set; }
    public long? PatientId { get; set; }
    public string NationalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Note { get; set; }
    public AppointmentBookingStatus Status { get; set; } = AppointmentBookingStatus.Booked;
    /// <summary>نوبت پذیرش‌شده در سیستم فعلی (صف/ویزیت).</summary>
    public long? AppointmentId { get; set; }
    public bool BookedByStaff { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public AppointmentSlot Slot { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
    public Patient? Patient { get; set; }
    public Appointment? Appointment { get; set; }
    public ICollection<ServiceType> RequestedServices { get; set; }
}
