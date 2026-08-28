using Share.Domain.Entities;

namespace Healan.Domain.Portal.Entities;

public class VaricoseCase : AuditableEntity
{
    public long VaricoseCaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid BeforeImageFileId { get; set; }
    public string BeforeImageUrl { get; set; } = string.Empty;
    public Guid AfterImageFileId { get; set; }
    public string AfterImageUrl { get; set; } = string.Empty;
    public string? TreatmentLabel { get; set; }
    public int SortOrder { get; set; }
    public bool HasPublicationConsent { get; set; }
    public bool IsPublished { get; set; }
}
