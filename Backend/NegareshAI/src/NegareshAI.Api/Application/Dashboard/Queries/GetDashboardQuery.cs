using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Dashboard.Queries;

public sealed record GetDashboardQuery : IRequest<DashboardResponse>;

public sealed class GetDashboardQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant) : IRequestHandler<GetDashboardQuery, DashboardResponse>
{
    public async Task<DashboardResponse> Handle(
        GetDashboardQuery request,
        CancellationToken cancellationToken)
    {
        var organizationId = tenant.OrganizationId;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var organizationName = await db.Organizations
            .Where(item => item.Id == organizationId)
            .Select(item => item.Name)
            .SingleOrDefaultAsync(cancellationToken) ?? "Organization";
        var documentCount = await db.Documents.CountAsync(
            item => item.OrganizationId == organizationId, cancellationToken);
        var activeContractCount = await db.Contracts.CountAsync(
            item => item.OrganizationId == organizationId
                && item.Status == ContractStatus.Active, cancellationToken);
        var pendingReviewCount = await db.Contracts.CountAsync(
            item => item.OrganizationId == organizationId
                && item.Status == ContractStatus.UnderReview, cancellationToken);
        var readyDocumentCount = await db.Documents.CountAsync(
            item => item.OrganizationId == organizationId
                && item.ProcessingStatus == DocumentProcessingStatus.Ready,
            cancellationToken);

        var recentDocuments = await db.Documents
            .AsNoTracking()
            .Where(item => item.OrganizationId == organizationId)
            .OrderByDescending(item => item.UpdatedAtUtc)
            .Take(6)
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

        var activities = await db.AuditLogs
            .AsNoTracking()
            .Where(item => item.OrganizationId == organizationId)
            .OrderByDescending(item => item.CreatedAtUtc)
            .Take(6)
            .Select(item => new DashboardActivityResponse(
                item.Action, item.EntityType, item.EntityId, item.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        var deadlines = await db.Contracts
            .AsNoTracking()
            .Where(item => item.OrganizationId == organizationId
                && item.EndDate != null
                && item.EndDate >= today
                && item.Status != ContractStatus.Archived
                && item.Status != ContractStatus.Terminated)
            .OrderBy(item => item.EndDate)
            .Take(6)
            .Select(item => new { item.Id, item.Subject, EndDate = item.EndDate!.Value })
            .ToListAsync(cancellationToken);

        return new DashboardResponse(
            organizationName,
            tenant.UserId,
            documentCount,
            activeContractCount,
            pendingReviewCount,
            readyDocumentCount,
            recentDocuments,
            activities,
            deadlines.Select(item => new DashboardDeadlineResponse(
                item.Id,
                item.Subject,
                item.EndDate,
                item.EndDate.DayNumber - today.DayNumber)).ToList());
    }
}
