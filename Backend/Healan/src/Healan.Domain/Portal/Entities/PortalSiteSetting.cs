using Share.Domain.Entities;

namespace Healan.Domain.Portal.Entities;

public class PortalSiteSetting : AuditableEntity
{
    public long PortalSiteSettingId { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string? SettingGroup { get; set; }
    public string? Description { get; set; }
}
