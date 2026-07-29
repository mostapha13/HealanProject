using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

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
            .SingleOrDefaultAsync(item => item.Id == command.FindingId
                && item.ComparisonRun!.OrganizationId == tenant.OrganizationId,
                cancellationToken);
        if (finding is null) return null;
        finding.ReviewDecision = command.Request.Decision;
        finding.ReviewerComment = command.Request.Comment?.Trim();
        finding.CorrectedReason = command.Request.CorrectedReason?.Trim();
        finding.ReviewedByUserId = tenant.UserId;
        finding.ReviewedAtUtc = DateTime.UtcNow;
        audit.Add("comparison-finding.reviewed", nameof(ComparisonFinding),
            finding.Id.ToString(), new { finding.ReviewDecision, finding.ComparisonRunId });
        await db.SaveChangesAsync(cancellationToken);
        return ComparisonMapping.ToResponse(finding);
    }
}
