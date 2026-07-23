using Healan.Application.Portal.Dtos;
using Healan.Application.Portal;
using Healan.Application.Common.Interfaces;
using FileManager.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.PublishedBlogPostBySlug;

public class PublishedBlogPostBySlugQuery : IRequest<BlogPostDetailDto?>
{
    public string Slug { get; set; } = string.Empty;
}

public class PublishedBlogPostBySlugQueryHandler : IRequestHandler<PublishedBlogPostBySlugQuery, BlogPostDetailDto?>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _fileManagerTool;

    public PublishedBlogPostBySlugQueryHandler(IApplicationDbContext db, IFileManagerTool fileManagerTool)
    {
        _db = db;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<BlogPostDetailDto?> Handle(PublishedBlogPostBySlugQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
            return null;

        var settings = await _db.PortalSiteSettings.AsNoTracking()
            .ToDictionaryAsync(x => x.SettingKey, x => x.SettingValue, StringComparer.OrdinalIgnoreCase, cancellationToken);
        if (!PortalSectionVisibility.IsEnabled(settings, "blog"))
            return null;

        var now = DateTime.UtcNow;
        var slug = request.Slug.Trim();

        var post = await _db.BlogPosts.AsNoTracking()
            .Where(x => x.Slug == slug && x.IsPublished && (x.PublishedAt == null || x.PublishedAt <= now))
            .Select(x => new BlogPostDetailDto
            {
                BlogPostId = x.BlogPostId,
                Title = x.Title,
                Slug = x.Slug,
                Excerpt = x.Excerpt,
                Body = x.Body,
                CoverImageUrl = x.CoverImageUrl,
                CoverImageFileId = x.CoverImageFileId,
                MetaTitle = x.MetaTitle,
                MetaDescription = x.MetaDescription,
                OgImageUrl = x.OgImageUrl,
                IsPublished = x.IsPublished,
                PublishedAt = x.PublishedAt,
                CreatedAt = x.CreatedAt,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (post != null)
            await BlogPostImageResolver.ApplyCoverLinkAsync(post, _fileManagerTool, cancellationToken);

        return post;
    }
}
