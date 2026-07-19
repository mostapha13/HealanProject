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
    NoShow = 5,
}

public static class AppointmentBookingStatusTitles
{
    public static string ToPersian(byte status) => status switch
    {
        (byte)AppointmentBookingStatus.Booked => "رزرو شده",
        (byte)AppointmentBookingStatus.Cancelled => "لغو شده",
        (byte)AppointmentBookingStatus.Rescheduled => "جابه‌جا شده",
        (byte)AppointmentBookingStatus.Accepted => "انجام شده",
        (byte)AppointmentBookingStatus.NoShow => "حاضر نشد",
        _ => "نامشخص",
    };

    public static string ToPersian(AppointmentBookingStatus status) => ToPersian((byte)status);
}
