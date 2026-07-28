using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record UpdateDocumentCommand(
    Guid Id,
    string Title,
    string DocumentType,
    ConfidentialityLevel ConfidentialityLevel) : IRequest<DocumentResponse?>;

public sealed class UpdateDocumentCommandHandler(
    NegareshDbContext db,
    ICurrentTenant tenant,
    IAuditWriter auditWriter,
    IMapper mapper) : IRequestHandler<UpdateDocumentCommand, DocumentResponse?>
{
    public async Task<DocumentResponse?> Handle(
        UpdateDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var document = await db.Documents
            .Include(item => item.Versions)
            .SingleOrDefaultAsync(
                item => item.Id == request.Id
                    && item.OrganizationId == tenant.OrganizationId,
                cancellationToken);
        if (document is null)
            return null;

        document.Title = request.Title.Trim();
        document.DocumentType = request.DocumentType.Trim();
        document.ConfidentialityLevel = request.ConfidentialityLevel;
        document.UpdatedAtUtc = DateTime.UtcNow;
        auditWriter.Add("document.updated", nameof(Document), document.Id.ToString(), new
        {
            document.Title,
            document.DocumentType,
            document.ConfidentialityLevel
        });
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<DocumentResponse>(document);
    }
}
