using Healan.Domain.Booking.Enums;
using Healan.Domain.Doctors.Entities;

namespace Healan.Domain.Booking.Entities;

public class AppointmentSlot
{
    public long AppointmentSlotId { get; set; }
    public long DoctorId { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public AppointmentSlotStatus Status { get; set; } = AppointmentSlotStatus.Open;
    public AppointmentSlotSource Source { get; set; } = AppointmentSlotSource.Generated;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Doctor Doctor { get; set; } = null!;
    public AppointmentBooking? Booking { get; set; }
}
