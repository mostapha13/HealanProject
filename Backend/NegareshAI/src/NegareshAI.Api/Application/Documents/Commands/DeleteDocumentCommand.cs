using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record DeleteDocumentCommand(Guid Id) : IRequest<bool>;

public sealed class DeleteDocumentCommandHandler(
    NegareshDbContext db,
    ICurrentTenant tenant,
    IAuditWriter auditWriter) : IRequestHandler<DeleteDocumentCommand, bool>
{
    public async Task<bool> Handle(
        DeleteDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var document = await db.Documents.SingleOrDefaultAsync(
            item => item.Id == request.Id
                && item.OrganizationId == tenant.OrganizationId,
            cancellationToken);
        if (document is null)
            return false;

        document.IsDeleted = true;
        document.DeletedAtUtc = DateTime.UtcNow;
        document.DeletedByUserId = tenant.UserId;
        document.UpdatedAtUtc = DateTime.UtcNow;
        auditWriter.Add("document.deleted", nameof(Document), document.Id.ToString());
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
