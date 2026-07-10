using Healan.Domain.Portal.Enums;

namespace Healan.Application.Portal.Dtos;

public class PortalContentItemDto
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

public class PortalSiteSettingDto
{
    public long PortalSiteSettingId { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string? SettingGroup { get; set; }
    public string? Description { get; set; }
}

public class PatientReviewDto
{
    public long PatientReviewId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string ContactInfo { get; set; } = string.Empty;
    public string ReviewText { get; set; } = string.Empty;
    public int Rating { get; set; }
    public PatientReviewStatus Status { get; set; }
    public int SortOrder { get; set; }
    public string? AdminNote { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PublishedPortalSiteDto
{
    public Dictionary<string, string> Settings { get; set; } = new();
    public List<PortalContentItemDto> ContentItems { get; set; } = new();
    public List<PatientReviewDto> Reviews { get; set; } = new();
}

public class PortalMutationResult
{
    public long Id { get; set; }
}

public class BlogPostSummaryDto
{
    public long BlogPostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? CoverImageUrl { get; set; }
    public Guid? CoverImageFileId { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BlogPostDetailDto : BlogPostSummaryDto
{
    public string Body { get; set; } = string.Empty;
}
