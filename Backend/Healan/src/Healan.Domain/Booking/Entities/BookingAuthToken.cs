namespace Healan.Domain.Booking.Entities;

/// <summary>OTP / cooldown / session keys for portal booking (shared across API instances).</summary>
public class BookingAuthToken
{
    public string TokenKey { get; set; } = string.Empty;
    public string TokenValue { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
}
