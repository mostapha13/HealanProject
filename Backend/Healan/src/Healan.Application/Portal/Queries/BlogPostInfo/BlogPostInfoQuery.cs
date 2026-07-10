using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using FileManager.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.BlogPostInfo;

public class BlogPostInfoQuery : IRequest<BlogPostDetailDto?>
{
    public long BlogPostId { get; set; }
}

public class BlogPostInfoQueryHandler : IRequestHandler<BlogPostInfoQuery, BlogPostDetailDto?>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _fileManagerTool;

    public BlogPostInfoQueryHandler(IApplicationDbContext db, IFileManagerTool fileManagerTool)
    {
        _db = db;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<BlogPostDetailDto?> Handle(BlogPostInfoQuery request, CancellationToken cancellationToken)
    {
        var post = await _db.BlogPosts.AsNoTracking()
            .Where(x => x.BlogPostId == request.BlogPostId)
            .Select(x => new BlogPostDetailDto
            {
                BlogPostId = x.BlogPostId,
                Title = x.Title,
                Slug = x.Slug,
                Excerpt = x.Excerpt,
                Body = x.Body,
                CoverImageUrl = x.CoverImageUrl,
                CoverImageFileId = x.CoverImageFileId,
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
