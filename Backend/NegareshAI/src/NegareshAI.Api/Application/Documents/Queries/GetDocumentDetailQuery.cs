using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Documents.Queries;

public sealed record GetDocumentDetailQuery(Guid Id, bool IncludeArchived = false)
    : IRequest<DocumentDetailResponse?>;

public sealed class GetDocumentDetailQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant) : IRequestHandler<GetDocumentDetailQuery, DocumentDetailResponse?>
{
    public async Task<DocumentDetailResponse?> Handle(
        GetDocumentDetailQuery request,
        CancellationToken cancellationToken)
    {
        var query = request.IncludeArchived
            ? db.Documents.IgnoreQueryFilters().AsNoTracking()
            : db.Documents.AsNoTracking();
        return await query.Where(item => item.Id == request.Id
                && item.OrganizationId == tenant.OrganizationId)
            .Select(item => new DocumentDetailResponse(
                item.Id, item.OrganizationId, item.Title, item.DocumentType,
                item.ConfidentialityLevel, item.ProcessingStatus, item.IsDeleted,
                item.CreatedAtUtc, item.UpdatedAtUtc,
                item.Versions.OrderByDescending(version => version.VersionNumber)
                    .Select(version => new DocumentVersionResponse(
                        version.Id, version.VersionNumber, version.FileId,
                        version.ChangeSummary, version.CreatedByUserId,
                        version.CreatedAtUtc)).ToList()))
            .SingleOrDefaultAsync(cancellationToken);
    }
}

public sealed record ListArchivedDocumentsQuery : IRequest<IReadOnlyList<DocumentListItemResponse>>;

public sealed class ListArchivedDocumentsQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant)
    : IRequestHandler<ListArchivedDocumentsQuery, IReadOnlyList<DocumentListItemResponse>>
{
    public async Task<IReadOnlyList<DocumentListItemResponse>> Handle(
        ListArchivedDocumentsQuery request,
        CancellationToken cancellationToken) =>
        await db.Documents.IgnoreQueryFilters().AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId && item.IsDeleted)
            .OrderByDescending(item => item.DeletedAtUtc)
            .Select(item => new DocumentListItemResponse(
                item.Id, item.Title, item.DocumentType, item.Versions.Count,
                item.ConfidentialityLevel, item.ProcessingStatus,
                item.CreatedAtUtc, item.UpdatedAtUtc))
            .ToListAsync(cancellationToken);
}

public sealed record DownloadDocumentVersionQuery(
    Guid DocumentId,
    Guid VersionId,
    string? BearerToken) : IRequest<FileDownloadResponse?>;

public sealed class DownloadDocumentVersionQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant,
    Services.IFileManagerClient fileManager)
    : IRequestHandler<DownloadDocumentVersionQuery, FileDownloadResponse?>
{
    public async Task<FileDownloadResponse?> Handle(
        DownloadDocumentVersionQuery request,
        CancellationToken cancellationToken)
    {
        var fileId = await db.DocumentVersions.AsNoTracking()
            .Where(version => version.Id == request.VersionId
                && version.DocumentId == request.DocumentId
                && version.Document!.OrganizationId == tenant.OrganizationId)
            .Select(version => version.FileId)
            .SingleOrDefaultAsync(cancellationToken);
        if (fileId is null) return null;
        var download = await fileManager.DownloadAsync(
            fileId, request.BearerToken, cancellationToken);
        return new FileDownloadResponse(
            new MemoryStream(download.Content, writable: false),
            download.FileName,
            download.ContentType);
    }
}
