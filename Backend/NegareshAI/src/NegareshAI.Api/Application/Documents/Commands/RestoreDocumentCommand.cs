using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record RestoreDocumentCommand(Guid Id) : IRequest<bool>;

public sealed class RestoreDocumentCommandHandler(
    NegareshDbContext db,
    ICurrentTenant tenant,
    IAuditWriter audit) : IRequestHandler<RestoreDocumentCommand, bool>
{
    public async Task<bool> Handle(
        RestoreDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var document = await db.Documents.IgnoreQueryFilters().SingleOrDefaultAsync(
            item => item.Id == request.Id
                && item.OrganizationId == tenant.OrganizationId
                && item.IsDeleted,
            cancellationToken);
        if (document is null) return false;
        document.IsDeleted = false;
        document.DeletedAtUtc = null;
        document.DeletedByUserId = null;
        document.UpdatedAtUtc = DateTime.UtcNow;
        audit.Add("document.restored", nameof(Document), document.Id.ToString());
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
