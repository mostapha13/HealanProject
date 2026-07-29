using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Comparisons;

public sealed record ListComparisonRunsQuery
    : IRequest<IReadOnlyList<ComparisonRunSummaryResponse>>;

public sealed class ListComparisonRunsQueryHandler(
    NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<ListComparisonRunsQuery,
        IReadOnlyList<ComparisonRunSummaryResponse>>
{
    public async Task<IReadOnlyList<ComparisonRunSummaryResponse>> Handle(
        ListComparisonRunsQuery request, CancellationToken cancellationToken) =>
        await db.ComparisonRuns.AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId)
            .OrderByDescending(item => item.CreatedAtUtc)
            .Select(item => new ComparisonRunSummaryResponse(
                item.Id, item.TargetDocumentId, item.TargetDocument!.Title,
                item.BasisMode, item.Status, item.Outcome, item.ScorePercent,
                item.Findings.Count,
                item.Findings.Count(finding =>
                    finding.ReviewDecision == FindingReviewDecision.Pending),
                item.CreatedAtUtc))
            .ToListAsync(cancellationToken);
}

public sealed record GetComparisonRunQuery(Guid Id) : IRequest<ComparisonRunResponse?>;

public sealed class GetComparisonRunQueryHandler(
    NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<GetComparisonRunQuery, ComparisonRunResponse?>
{
    public async Task<ComparisonRunResponse?> Handle(
        GetComparisonRunQuery request, CancellationToken cancellationToken)
    {
        var run = await db.ComparisonRuns.AsNoTracking()
            .Include(item => item.TargetDocument)
            .Include(item => item.Findings)
            .SingleOrDefaultAsync(item => item.Id == request.Id
                && item.OrganizationId == tenant.OrganizationId,
                cancellationToken);
        return run is null ? null : ComparisonMapping.ToResponse(run);
    }
}
