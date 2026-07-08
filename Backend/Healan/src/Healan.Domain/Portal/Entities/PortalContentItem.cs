using Healan.Domain.Portal.Enums;
using Share.Domain.Entities;

namespace Healan.Domain.Portal.Entities;

public class PortalContentItem : AuditableEntity
{
    public long PortalContentItemId { get; set; }
    public PortalSectionType SectionType { get; set; }
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Body { get; set; }
    public string? ImageUrl { get; set; }
    public Guid? ImageFileId { get; set; }
    public string? IconName { get; set; }
    public string? LinkUrl { get; set; }
    public string? Color { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
}
