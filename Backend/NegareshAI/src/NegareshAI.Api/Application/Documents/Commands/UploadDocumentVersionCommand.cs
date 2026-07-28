using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record UploadDocumentVersionCommand(
    Guid DocumentId,
    IFormFile File,
    string? ChangeSummary,
    string? BearerToken) : IRequest<DocumentResponse?>;

public sealed class UploadDocumentVersionCommandHandler(
    NegareshDbContext db,
    ICurrentTenant tenant,
    IFileManagerClient fileManager,
    IAuditWriter auditWriter,
    IMapper mapper,
    ISender sender) : IRequestHandler<UploadDocumentVersionCommand, DocumentResponse?>
{
    public async Task<DocumentResponse?> Handle(
        UploadDocumentVersionCommand request,
        CancellationToken cancellationToken)
    {
        var document = await db.Documents
            .Include(item => item.Versions)
            .SingleOrDefaultAsync(
                item => item.Id == request.DocumentId
                    && item.OrganizationId == tenant.OrganizationId,
                cancellationToken);
        if (document is null)
            return null;

        await using var stream = request.File.OpenReadStream();
        var fileId = await fileManager.UploadAsync(
            stream,
            request.File.FileName,
            request.File.ContentType,
            request.BearerToken,
            cancellationToken);
        var nextVersion = document.Versions.Count == 0
            ? 1
            : document.Versions.Max(item => item.VersionNumber) + 1;
        var version = new DocumentVersion
        {
            DocumentId = document.Id,
            VersionNumber = nextVersion,
            FileId = fileId,
            ChangeSummary = request.ChangeSummary,
            CreatedByUserId = tenant.UserId
        };
        db.DocumentVersions.Add(version);
        document.ProcessingStatus = DocumentProcessingStatus.Uploaded;
        document.UpdatedAtUtc = DateTime.UtcNow;
        auditWriter.Add("document.version-created", nameof(Document), document.Id.ToString(), new
        {
            VersionNumber = nextVersion
        });
        await db.SaveChangesAsync(cancellationToken);
        await sender.Send(
            new ProcessDocumentCommand(document.Id, version.Id, request.BearerToken),
            cancellationToken);
        return mapper.Map<DocumentResponse>(document);
    }
}
