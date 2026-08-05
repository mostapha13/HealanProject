using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;
using NegareshAI.Api.Application.Common.Auditing;
using System.Security.Cryptography;
using System.Text.Json;

namespace NegareshAI.Api.Application.Comparisons;

public sealed record ListComparisonRunsQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResponse<ComparisonRunSummaryResponse>>;

public sealed class ListComparisonRunsQueryHandler(
    NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<ListComparisonRunsQuery, PagedResponse<ComparisonRunSummaryResponse>>
{
    public async Task<PagedResponse<ComparisonRunSummaryResponse>> Handle(
        ListComparisonRunsQuery request, CancellationToken cancellationToken) =>
        await db.ComparisonRuns.AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId)
            .OrderByDescending(item => item.CreatedAtUtc)
            .Select(item => new ComparisonRunSummaryResponse(
                item.Id, item.TargetDocumentId, item.TargetDocument!.Title,
                item.BasisMode, item.Status, item.Outcome, item.ScorePercent,
                item.HasCriticalFailure, item.ApprovalStatus,
                item.Findings.Count,
                item.Findings.Count(finding =>
                    finding.ReviewDecision == FindingReviewDecision.Pending),
                item.CreatedAtUtc))
            .ToPagedResponseAsync(
                new PageRequest(request.PageNumber, request.PageSize), cancellationToken);
}

public sealed record GenerateComparisonReportQuery(Guid Id, string Format)
    : IRequest<ComparisonReportResult?>;

public sealed record ComparisonReportResult(
    byte[] Content, string ContentType, string FileName);

public sealed class GenerateComparisonReportQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant,
    IComparisonReportGenerator reportGenerator,
    IAuditWriter audit)
    : IRequestHandler<GenerateComparisonReportQuery, ComparisonReportResult?>
{
    public async Task<ComparisonReportResult?> Handle(
        GenerateComparisonReportQuery request, CancellationToken cancellationToken)
    {
        var format = request.Format.ToLowerInvariant();
        if (format is not ("docx" or "pdf"))
            throw new ArgumentException("Report format must be docx or pdf.");
        var run = await db.ComparisonRuns
            .Include(item => item.TargetDocument)
            .Include(item => item.Findings)
            .Include(item => item.Reports)
            .SingleOrDefaultAsync(item =>
                item.Id == request.Id && item.OrganizationId == tenant.OrganizationId,
                cancellationToken);
        if (run is null) return null;
        var content = await reportGenerator.GenerateAsync(
            run, format, cancellationToken);
        var reportVersion = run.Reports.Where(x => x.Format == format)
            .Select(x => x.Version).DefaultIfEmpty().Max() + 1;
        var snapshot = JsonSerializer.Serialize(new
        {
            run.Id, run.TargetVersionId, run.RuleSetSnapshotJson,
            run.CriterionSnapshotJson, run.SourceSnapshotJson, run.ToolTraceJson,
            run.ScorePercent, run.PassingThreshold, run.HasCriticalFailure,
            run.Outcome, run.OutcomeExplanation, run.ApprovalStatus,
            Findings = run.Findings.Select(x => new { x.Id, x.Type, x.IsPassed,
                x.ReviewDecision, x.CorrectedReason, x.ReviewerComment })
        });
        var artifact = new ComparisonReportArtifact
        {
            ComparisonRunId = run.Id,
            Version = reportVersion, Format = format, Content = content,
            Sha256 = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant(),
            SnapshotJson = snapshot, GeneratedByUserId = tenant.UserId
        };
        // The artifact uses a client-generated Guid. Adding it only through the
        // already-tracked navigation can make EF treat that non-default key as an
        // existing row and issue an UPDATE. Mark it explicitly as Added so every
        // report download persists a new immutable version.
        db.ComparisonReportArtifacts.Add(artifact);
        audit.Add("comparison.report-version-generated", nameof(ComparisonReportArtifact),
            run.Id.ToString(), new { Format = format, Version = reportVersion });
        await db.SaveChangesAsync(cancellationToken);
        var contentType = format == "pdf" ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        return new ComparisonReportResult(
            content, contentType, $"comparison-{request.Id:N}-v{reportVersion}.{format}");
    }
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
