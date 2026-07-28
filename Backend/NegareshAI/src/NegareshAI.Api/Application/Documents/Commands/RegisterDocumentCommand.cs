using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record RegisterDocumentCommand(
    string Title,
    string DocumentType,
    string FileId,
    ConfidentialityLevel ConfidentialityLevel) : IRequest<DocumentResponse>;

public sealed class RegisterDocumentCommandHandler(
    NegareshDbContext db,
    IMapper mapper,
    ICurrentTenant tenant,
    IAuditWriter auditWriter) : IRequestHandler<RegisterDocumentCommand, DocumentResponse>
{
    public async Task<DocumentResponse> Handle(
        RegisterDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var document = mapper.Map<Document>(request);
        document.OrganizationId = tenant.OrganizationId;
        document.OwnerUserId = tenant.UserId;
        document.Versions.Add(new DocumentVersion
        {
            DocumentId = document.Id,
            VersionNumber = 1,
            FileId = request.FileId,
            CreatedByUserId = tenant.UserId
        });

        if (!await db.OrganizationMemberships.AnyAsync(
                item => item.OrganizationId == tenant.OrganizationId
                    && item.UserId == tenant.UserId,
                cancellationToken))
        {
            db.OrganizationMemberships.Add(new OrganizationMembership
            {
                OrganizationId = tenant.OrganizationId,
                UserId = tenant.UserId
            });
        }

        db.Documents.Add(document);
        auditWriter.Add("document.created", nameof(Document), document.Id.ToString(), new
        {
            document.DocumentType,
            document.ConfidentialityLevel
        });
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<DocumentResponse>(document);
    }
}
