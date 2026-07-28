using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Documents.Queries;

public sealed record ListDocumentsQuery(
    string? Search,
    string? DocumentType,
    DocumentProcessingStatus? ProcessingStatus,
    int Page = 1,
    int PageSize = 20) : IRequest<DocumentListResponse>;

public sealed class ListDocumentsQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant) : IRequestHandler<ListDocumentsQuery, DocumentListResponse>
{
    public async Task<DocumentListResponse> Handle(
        ListDocumentsQuery request,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var query = db.Documents
            .AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(item => item.Title.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(request.DocumentType))
            query = query.Where(item => item.DocumentType == request.DocumentType);

        if (request.ProcessingStatus.HasValue)
            query = query.Where(item => item.ProcessingStatus == request.ProcessingStatus);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(item => item.UpdatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => new DocumentListItemResponse(
                item.Id,
                item.Title,
                item.DocumentType,
                item.Versions.Count,
                item.ConfidentialityLevel,
                item.ProcessingStatus,
                item.CreatedAtUtc,
                item.UpdatedAtUtc))
            .ToListAsync(cancellationToken);

        return new DocumentListResponse(items, page, pageSize, totalCount);
    }
}
