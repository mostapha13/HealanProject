using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Entities;
using FileManager.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.BlogPostRegister;

public class BlogPostRegisterCommand : IRequest<PortalMutationResult>
{
    public long? BlogPostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Excerpt { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public Guid? CoverImageFileId { get; set; }
    public string? Tags { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
    public bool IsPublished { get; set; } = true;
    public DateTime? PublishedAt { get; set; }
}

public class BlogPostRegisterCommandHandler : IRequestHandler<BlogPostRegisterCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _fileManagerTool;

    public BlogPostRegisterCommandHandler(IApplicationDbContext db, IFileManagerTool fileManagerTool)
    {
        _db = db;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<PortalMutationResult> Handle(BlogPostRegisterCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestExceptions("عنوان مطلب الزامی است");

        if (string.IsNullOrWhiteSpace(request.Body))
            throw new BadRequestExceptions("متن مطلب الزامی است");

        BlogPost? post = null;
        if (request.BlogPostId is > 0)
        {
            post = await _db.BlogPosts
                .FirstOrDefaultAsync(x => x.BlogPostId == request.BlogPostId, cancellationToken);
        }

        if (post == null)
        {
            post = new BlogPost();
            _db.BlogPosts.Add(post);
        }

        var slug = await BlogSlugHelper.EnsureUniqueSlugAsync(
            async candidate => await _db.BlogPosts.AnyAsync(
                x => x.Slug == candidate && x.BlogPostId != post.BlogPostId,
                cancellationToken),
            request.Slug,
            request.Title);

        post.Title = request.Title.Trim();
        post.Slug = slug;
        post.Excerpt = request.Excerpt?.Trim();
        post.Body = request.Body.Trim();
        post.CoverImageFileId = request.CoverImageFileId;
        post.Tags = string.IsNullOrWhiteSpace(request.Tags) ? null : request.Tags.Trim();
        post.MetaTitle = request.MetaTitle?.Trim();
        post.MetaDescription = request.MetaDescription?.Trim();
        post.OgImageUrl = request.OgImageUrl?.Trim();
        post.IsPublished = request.IsPublished;

        if (request.IsPublished)
        {
            post.PublishedAt = request.PublishedAt ?? post.PublishedAt ?? DateTime.UtcNow;
        }
        // هنگام عدم انتشار تاریخ انتشار قبلی را پاک نکن (تاریخچه بماند)

        if (request.CoverImageFileId.HasValue)
        {
            var fileInfo = await _fileManagerTool.GetFileReplyInfo(request.CoverImageFileId.Value);
            post.CoverImageUrl = string.IsNullOrWhiteSpace(fileInfo.Link)
                ? request.CoverImageUrl?.Trim()
                : fileInfo.Link.Trim();
        }
        else
        {
            post.CoverImageFileId = null;
            post.CoverImageUrl = request.CoverImageUrl?.Trim();
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = post.BlogPostId };
    }
}
