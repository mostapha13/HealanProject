using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Common.Pagination;
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
                        version.CreatedAtUtc, version.LifecycleStatus,
                        version.ExtractedText, version.ExtractedFieldsJson,
                        version.ExtractionMetadataJson,
                        version.ExpertReviewedByUserId, version.ExpertReviewedAtUtc,
                        version.ExpertReviewNote, version.ManagerReviewedByUserId,
                        version.ManagerReviewedAtUtc, version.ManagerReviewNote,
                        version.IsRagPublished, version.RagPublishedAtUtc,
                        version.Files.OrderBy(file => file.SortOrder)
                            .Select(file => new DocumentVersionFileResponse(
                                file.Id, file.FileId, file.FileName, file.ContentType,
                                file.SortOrder, file.PageNumber, file.Sha256, file.Size))
                            .ToList())).ToList()))
            .SingleOrDefaultAsync(cancellationToken);
    }
}

public sealed record ListArchivedDocumentsQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResponse<DocumentListItemResponse>>;

public sealed class ListArchivedDocumentsQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant)
    : IRequestHandler<ListArchivedDocumentsQuery, PagedResponse<DocumentListItemResponse>>
{
    public async Task<PagedResponse<DocumentListItemResponse>> Handle(
        ListArchivedDocumentsQuery request,
        CancellationToken cancellationToken) =>
        await db.Documents.IgnoreQueryFilters().AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId && item.IsDeleted)
            .OrderByDescending(item => item.DeletedAtUtc)
            .Select(item => new DocumentListItemResponse(
                item.Id, item.Title, item.DocumentType, item.Versions.Count,
                item.ConfidentialityLevel, item.ProcessingStatus,
                item.CreatedAtUtc, item.UpdatedAtUtc))
            .ToPagedResponseAsync(
                new PageRequest(request.PageNumber, request.PageSize), cancellationToken);
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
