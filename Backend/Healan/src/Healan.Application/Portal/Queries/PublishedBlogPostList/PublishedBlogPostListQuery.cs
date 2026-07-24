using Healan.Application.Portal.Dtos;
using Healan.Application.Portal;
using Healan.Application.Common.Interfaces;
using FileManager.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Portal.Queries.PublishedBlogPostList;

public class PublishedBlogPostListQuery : IRequest<PaginatedList<BlogPostSummaryDto>>
{
    public string? FilterText { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PublishedBlogPostListQueryHandler : IRequestHandler<PublishedBlogPostListQuery, PaginatedList<BlogPostSummaryDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _fileManagerTool;

    public PublishedBlogPostListQueryHandler(IApplicationDbContext db, IFileManagerTool fileManagerTool)
    {
        _db = db;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<PaginatedList<BlogPostSummaryDto>> Handle(PublishedBlogPostListQuery request, CancellationToken cancellationToken)
    {
        var settings = await _db.PortalSiteSettings.AsNoTracking()
            .ToDictionaryAsync(x => x.SettingKey, x => x.SettingValue, StringComparer.OrdinalIgnoreCase, cancellationToken);
        if (!PortalSectionVisibility.IsEnabled(settings, "blog"))
        {
            return new PaginatedList<BlogPostSummaryDto>(
                new List<BlogPostSummaryDto>(),
                0,
                request.PageNumber,
                request.PageSize);
        }

        var now = DateTime.UtcNow;
        var query = _db.BlogPosts.AsNoTracking()
            .Where(x => x.IsPublished && (x.PublishedAt == null || x.PublishedAt <= now));

        if (!string.IsNullOrWhiteSpace(request.FilterText))
        {
            var filter = request.FilterText.Trim();
            query = query.Where(x =>
                x.Title.Contains(filter) ||
                (x.Excerpt != null && x.Excerpt.Contains(filter)));
        }

        var projected = query
            .OrderByDescending(x => x.PublishedAt ?? x.CreatedAt)
            .ThenByDescending(x => x.BlogPostId)
            .Select(x => new BlogPostSummaryDto
            {
                BlogPostId = x.BlogPostId,
                Title = x.Title,
                Slug = x.Slug,
                Excerpt = x.Excerpt,
                CoverImageUrl = x.CoverImageUrl,
                CoverImageFileId = x.CoverImageFileId,
                Tags = x.Tags,
                MetaTitle = x.MetaTitle,
                MetaDescription = x.MetaDescription,
                OgImageUrl = x.OgImageUrl,
                IsPublished = x.IsPublished,
                PublishedAt = x.PublishedAt,
                CreatedAt = x.CreatedAt,
            });

        var page = await projected.PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
        await BlogPostImageResolver.ApplyCoverLinksAsync(page.Items, _fileManagerTool, cancellationToken);
        return page;
    }
}
