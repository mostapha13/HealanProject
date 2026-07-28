using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Documents.Queries;

public sealed record GetDocumentQuery(Guid Id) : IRequest<DocumentResponse?>;

public sealed class GetDocumentQueryHandler(
    NegareshDbContext db,
    IMapper mapper,
    ICurrentTenant tenant,
    IAuditWriter auditWriter) : IRequestHandler<GetDocumentQuery, DocumentResponse?>
{
    public async Task<DocumentResponse?> Handle(
        GetDocumentQuery request,
        CancellationToken cancellationToken)
    {
        var document = await db.Documents
            .AsNoTracking()
            .Include(item => item.Versions)
            .SingleOrDefaultAsync(
                item => item.Id == request.Id
                    && item.OrganizationId == tenant.OrganizationId,
                cancellationToken);

        if (document is null)
            return null;

        auditWriter.Add("document.viewed", nameof(Document), document.Id.ToString());
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<DocumentResponse>(document);
    }
}
