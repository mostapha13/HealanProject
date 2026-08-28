using Share.Domain.Entities;

namespace Healan.Domain.Portal.Entities;

public class PortalContactMessage : AuditableEntity
{
    public long PortalContactMessageId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? AdminNote { get; set; }
    public DateTime? ReadAt { get; set; }
}
