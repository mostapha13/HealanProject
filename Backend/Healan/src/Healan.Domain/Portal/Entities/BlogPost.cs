using Share.Domain.Entities;

namespace Healan.Domain.Portal.Entities;

public class BlogPost : AuditableEntity
{
    public long BlogPostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public Guid? CoverImageFileId { get; set; }
    public bool IsPublished { get; set; } = true;
    public DateTime? PublishedAt { get; set; }
}
