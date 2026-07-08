using Healan.Domain.Portal.Enums;
using Share.Domain.Entities;

namespace Healan.Domain.Portal.Entities;

public class PatientReview : AuditableEntity
{
    public long PatientReviewId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string ContactInfo { get; set; } = string.Empty;
    public string ReviewText { get; set; } = string.Empty;
    public int Rating { get; set; }
    public PatientReviewStatus Status { get; set; } = PatientReviewStatus.Pending;
    public int SortOrder { get; set; }
    public string? AdminNote { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
}
