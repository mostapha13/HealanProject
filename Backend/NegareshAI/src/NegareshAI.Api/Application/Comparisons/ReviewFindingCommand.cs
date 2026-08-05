using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Application.Access;

namespace NegareshAI.Api.Application.Comparisons;

public sealed record ReviewFindingCommand(Guid FindingId, ReviewFindingRequest Request)
    : IRequest<ComparisonFindingResponse?>;

public sealed class ReviewFindingCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<ReviewFindingCommand, ComparisonFindingResponse?>
{
    public async Task<ComparisonFindingResponse?> Handle(
        ReviewFindingCommand command, CancellationToken cancellationToken)
    {
        if (command.Request.Decision == FindingReviewDecision.Pending)
            throw new ArgumentException("A final review decision is required.");
        if (command.Request.Decision == FindingReviewDecision.Corrected
            && string.IsNullOrWhiteSpace(command.Request.CorrectedReason))
            throw new ArgumentException("CorrectedReason is required for a correction.");
        var finding = await db.ComparisonFindings.Include(item => item.ComparisonRun)
            .ThenInclude(item => item!.Findings)
            .SingleOrDefaultAsync(item => item.Id == command.FindingId
                && item.ComparisonRun!.OrganizationId == tenant.OrganizationId,
                cancellationToken);
        if (finding is null) return null;
        finding.ReviewDecision = command.Request.Decision;
        finding.ReviewerComment = command.Request.Comment?.Trim();
        finding.CorrectedReason = command.Request.CorrectedReason?.Trim();
        finding.ReviewedByUserId = tenant.UserId;
        finding.ReviewedAtUtc = DateTime.UtcNow;
        if (command.Request.Decision == FindingReviewDecision.Rejected
            && finding.IsApplicable)
            finding.IsPassed = true;
        var run = finding.ComparisonRun!;
        var decision = new ComparisonConflictDecision
        {
            OrganizationId = tenant.OrganizationId,
            ComparisonRunId = run.Id,
            ComparisonFindingId = finding.Id,
            DocumentGroupId = run.DocumentGroupId,
            Scope = command.Request.PersistForDocumentGroup
                ? ConflictDecisionScope.DocumentGroup : ConflictDecisionScope.Run,
            DecisionKey = StartComparisonCommandHandler.DecisionKey(
                finding.ComplianceCriterionId, finding.RuleId, finding.Title),
            Decision = command.Request.Decision,
            Reason = command.Request.CorrectedReason?.Trim()
                ?? command.Request.Comment?.Trim() ?? finding.Reason,
            DecidedByUserId = tenant.UserId
        };
        if (command.Request.PersistForDocumentGroup && run.DocumentGroupId is null)
            throw new InvalidOperationException("A group reference decision requires a document group.");
        db.ComparisonConflictDecisions.Add(decision);
        StartComparisonCommandHandler.Complete(run);
        audit.Add("comparison-finding.reviewed", nameof(ComparisonFinding),
            finding.Id.ToString(), new { finding.ReviewDecision, finding.ComparisonRunId });
        await db.SaveChangesAsync(cancellationToken);
        return ComparisonMapping.ToResponse(finding);
    }
}

public sealed record ReviewComparisonCommand(Guid RunId, ReviewComparisonRequest Request)
    : IRequest<ComparisonRunResponse?>;

public sealed class ReviewComparisonCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit,
    IDataScopeAuthorizer? authorizer = null)
    : IRequestHandler<ReviewComparisonCommand, ComparisonRunResponse?>
{
    public async Task<ComparisonRunResponse?> Handle(
        ReviewComparisonCommand command, CancellationToken cancellationToken)
    {
        var run = await db.ComparisonRuns.Include(item => item.TargetDocument)
            .ThenInclude(item => item!.Versions).Include(item => item.Findings)
            .SingleOrDefaultAsync(item => item.Id == command.RunId
                && item.OrganizationId == tenant.OrganizationId, cancellationToken);
        if (run is null || run.ApprovalStatus != ComparisonApprovalStatus.PendingExpertReview)
            return null;
        if (run.DocumentGroupId is not null && authorizer is not null
            && !await authorizer.CanAccessAsync(DataScopeResourceType.DocumentGroup,
                run.DocumentGroupId.Value, cancellationToken)) return null;
        if (run.Findings.Any(item => item.ReviewDecision == FindingReviewDecision.Pending))
            throw new InvalidOperationException("تمام یافته‌ها باید پیش از تأیید نتیجه تعیین تکلیف شوند.");

        run.ExpertReviewedByUserId = tenant.UserId;
        run.ExpertReviewedAtUtc = DateTime.UtcNow;
        run.ExpertReviewNote = command.Request.Note?.Trim();
        run.ApprovalStatus = command.Request.Approved
            ? ComparisonApprovalStatus.ExpertApproved
            : ComparisonApprovalStatus.ExpertRejected;
        var targetVersion = run.TargetDocument!.Versions.Single(x => x.Id == run.TargetVersionId);
        targetVersion.ExpertReviewedByUserId = tenant.UserId;
        targetVersion.ExpertReviewedAtUtc = run.ExpertReviewedAtUtc;
        targetVersion.ExpertReviewNote = $"نتیجه انطباق {run.Id:N}: {run.ExpertReviewNote}";
        targetVersion.LifecycleStatus = command.Request.Approved
            ? DocumentVersionLifecycleStatus.ManagerReview
            : DocumentVersionLifecycleStatus.Rejected;
        audit.Add(command.Request.Approved ? "comparison.expert-approved"
                : "comparison.expert-rejected", nameof(ComparisonRun), run.Id.ToString(),
            new { command.Request.Note, run.TargetVersionId });
        await db.SaveChangesAsync(cancellationToken);
        return ComparisonMapping.ToResponse(run);
    }
}
