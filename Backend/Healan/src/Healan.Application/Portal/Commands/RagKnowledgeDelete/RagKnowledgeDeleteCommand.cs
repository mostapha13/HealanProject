using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.RagKnowledgeDelete;

public class RagKnowledgeDeleteCommand : IRequest<PortalMutationResult>
{
    public long RagKnowledgeItemId { get; set; }
}

public class RagKnowledgeDeleteCommandHandler : IRequestHandler<RagKnowledgeDeleteCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;

    public RagKnowledgeDeleteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<PortalMutationResult> Handle(RagKnowledgeDeleteCommand request, CancellationToken cancellationToken)
    {
        var item = await _db.RagKnowledgeItems
            .FirstOrDefaultAsync(x => x.RagKnowledgeItemId == request.RagKnowledgeItemId, cancellationToken)
            ?? throw new NotFoundExceptions("سوال دانش پایه یافت نشد");

        _db.RagKnowledgeItems.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = item.RagKnowledgeItemId };
    }
}
