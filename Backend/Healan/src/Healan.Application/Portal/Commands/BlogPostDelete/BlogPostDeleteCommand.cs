using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Commands.BlogPostDelete;

public class BlogPostDeleteCommand : IRequest<PortalMutationResult>
{
    public long BlogPostId { get; set; }
}

public class BlogPostDeleteCommandHandler : IRequestHandler<BlogPostDeleteCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;

    public BlogPostDeleteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<PortalMutationResult> Handle(BlogPostDeleteCommand request, CancellationToken cancellationToken)
    {
        var post = await _db.BlogPosts
            .FirstOrDefaultAsync(x => x.BlogPostId == request.BlogPostId, cancellationToken)
            ?? throw new KeyNotFoundException("مطلب بلاگ یافت نشد");

        post.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = post.BlogPostId };
    }
}
