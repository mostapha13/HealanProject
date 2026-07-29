using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Comparisons;

internal static class ComparisonMapping
{
    public static ComparisonRunResponse ToResponse(ComparisonRun item) =>
        new(item.Id, item.TargetDocumentId, item.TargetVersionId,
            item.TargetDocument?.Title ?? string.Empty, item.BasisMode,
            item.DocumentGroupId, item.ReferenceDocumentId, item.ReferenceVersionId,
            item.UserInstruction, item.RuleSetSnapshotJson, item.SourceSnapshotJson,
            item.ModelId, item.PromptVersion, item.Status, item.Outcome,
            item.ScorePercent, item.FailureReason, item.CreatedByUserId,
            item.CreatedAtUtc, item.CompletedAtUtc,
            item.Findings.OrderByDescending(finding => finding.Severity)
                .ThenBy(finding => finding.Title).Select(ToResponse).ToArray());

    public static ComparisonFindingResponse ToResponse(ComparisonFinding item) =>
        new(item.Id, item.RuleId, item.Type, item.Severity, item.Title, item.Reason,
            item.TargetEvidence, item.TargetPage, item.TargetSection,
            item.ReferenceEvidence, item.ReferencePage, item.Suggestion,
            item.Confidence, item.ReviewDecision, item.ReviewerComment,
            item.CorrectedReason, item.ReviewedByUserId, item.ReviewedAtUtc);
}
