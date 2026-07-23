using Share.Domain.Entities;

namespace Healan.Domain.Portal.Entities;

/// <summary>
/// SEO metadata for public site paths (home, blog index, custom pages).
/// Blog post-level SEO lives on <see cref="BlogPost"/>.
/// </summary>
public class PortalSeoPage : AuditableEntity
{
    public long PortalSeoPageId { get; set; }
    /// <summary>Stable key e.g. home, blog, custom-about</summary>
    public string PageKey { get; set; } = string.Empty;
    /// <summary>Public path e.g. /, /blog</summary>
    public string Path { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Keywords { get; set; }
    public string? OgTitle { get; set; }
    public string? OgDescription { get; set; }
    public string? OgImageUrl { get; set; }
    public Guid? OgImageFileId { get; set; }
    public string? CanonicalUrl { get; set; }
    /// <summary>e.g. index,follow or noindex,nofollow</summary>
    public string Robots { get; set; } = "index,follow";
    /// <summary>Optional extra JSON-LD object(s) merged into page schema</summary>
    public string? JsonLdExtra { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
