namespace Healan.Domain.Booking.Enums;

public enum AppointmentSlotStatus : byte
{
    Open = 1,
    Booked = 2,
    Blocked = 3,
}

public enum AppointmentSlotSource : byte
{
    Generated = 1,
    Manual = 2,
}

public enum AppointmentBookingStatus : byte
{
    Booked = 1,
    Cancelled = 2,
    Rescheduled = 3,
    Accepted = 4,
}
