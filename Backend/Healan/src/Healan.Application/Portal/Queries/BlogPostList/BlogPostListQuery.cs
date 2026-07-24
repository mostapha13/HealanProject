using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using FileManager.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Portal.Queries.BlogPostList;

public class BlogPostListQuery : AbstractSearchRequest<PaginatedList<BlogPostSummaryDto>>
{
    public string? FilterText { get; set; }
    public bool? IsPublished { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}

public class BlogPostListQueryHandler : IRequestHandler<BlogPostListQuery, PaginatedList<BlogPostSummaryDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _fileManagerTool;

    public BlogPostListQueryHandler(IApplicationDbContext db, IFileManagerTool fileManagerTool)
    {
        _db = db;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<PaginatedList<BlogPostSummaryDto>> Handle(BlogPostListQuery request, CancellationToken cancellationToken)
    {
        var query = _db.BlogPosts.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.FilterText))
        {
            var filter = request.FilterText.Trim();
            query = query.Where(x =>
                x.Title.Contains(filter) ||
                x.Slug.Contains(filter) ||
                (x.Excerpt != null && x.Excerpt.Contains(filter)) ||
                (x.Tags != null && x.Tags.Contains(filter)));
        }

        if (request.IsPublished.HasValue)
            query = query.Where(x => x.IsPublished == request.IsPublished.Value);

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
