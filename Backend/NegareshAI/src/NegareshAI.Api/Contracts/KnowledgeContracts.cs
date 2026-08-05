using NegareshAI.Api.Data;

namespace NegareshAI.Api.Contracts;

public sealed record CreateDocumentGroupRequest(
    string Name,
    string? Description,
    IReadOnlyCollection<Guid> DocumentIds,
    decimal PassingThreshold = 80m);
public sealed record UpdateDocumentGroupRequest(
    string Name, string? Description, bool IsActive,
    IReadOnlyCollection<Guid> DocumentIds, decimal PassingThreshold = 80m);

public sealed record DocumentGroupResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal PassingThreshold,
    bool IsActive,
    IReadOnlyCollection<Guid> DocumentIds,
    DateTime CreatedAtUtc);

public sealed record CreateRuleParameterRequest(string Key, string ValueJson);

public sealed record CreateRuleRequest(
    string Code,
    string Title,
    string Instruction,
    int Severity,
    int Order,
    IReadOnlyCollection<CreateRuleParameterRequest> Parameters);

public sealed record CreateRuleSetRequest(
    string Name,
    Guid? DocumentGroupId,
    DateTime? EffectiveFromUtc,
    DateTime? EffectiveToUtc,
    IReadOnlyCollection<CreateRuleRequest> Rules);

public sealed record RuleParameterResponse(Guid Id, string Key, string ValueJson);

public sealed record RuleResponse(
    Guid Id,
    string Code,
    string Title,
    string Instruction,
    int Severity,
    int Order,
    bool IsActive,
    IReadOnlyCollection<RuleParameterResponse> Parameters);

public sealed record RuleSetResponse(
    Guid Id,
    string Name,
    int Version,
    Guid? DocumentGroupId,
    DateTime EffectiveFromUtc,
    DateTime? EffectiveToUtc,
    bool IsActive,
    IReadOnlyCollection<RuleResponse> Rules);

public sealed record StartComparisonRequest(
    Guid TargetDocumentId,
    Guid? TargetVersionId,
    ComparisonBasisMode BasisMode,
    Guid? DocumentGroupId,
    IReadOnlyCollection<Guid> RuleSetIds,
    Guid? ReferenceDocumentId,
    Guid? ReferenceVersionId,
    string? UserInstruction);

public sealed record ReviewFindingRequest(
    FindingReviewDecision Decision,
    string? Comment,
    string? CorrectedReason,
    bool PersistForDocumentGroup = false);

public sealed record ReviewComparisonRequest(bool Approved, string? Note);

public sealed record ComparisonFindingResponse(
    Guid Id,
    Guid? RuleId,
    Guid? ComplianceCriterionId,
    FindingType Type,
    int Severity,
    decimal Weight,
    bool IsCritical,
    bool IsApplicable,
    bool IsPassed,
    string Title,
    string Reason,
    string? TargetEvidence,
    int? TargetPage,
    string? TargetSection,
    string? ReferenceEvidence,
    int? ReferencePage,
    string? ReferenceSection,
    Guid? ReferenceDocumentId,
    Guid? ReferenceVersionId,
    string? Suggestion,
    decimal Confidence,
    FindingReviewDecision ReviewDecision,
    string? ReviewerComment,
    string? CorrectedReason,
    string? ReviewedByUserId,
    DateTime? ReviewedAtUtc);

public sealed record ComparisonRunSummaryResponse(
    Guid Id,
    Guid TargetDocumentId,
    string TargetDocumentTitle,
    ComparisonBasisMode BasisMode,
    ComparisonRunStatus Status,
    ComparisonOutcome? Outcome,
    decimal? ScorePercent,
    bool HasCriticalFailure,
    ComparisonApprovalStatus ApprovalStatus,
    int FindingCount,
    int PendingReviewCount,
    DateTime CreatedAtUtc);

public sealed record ComparisonRunResponse(
    Guid Id,
    Guid TargetDocumentId,
    Guid TargetVersionId,
    string TargetDocumentTitle,
    ComparisonBasisMode BasisMode,
    Guid? DocumentGroupId,
    Guid? ReferenceDocumentId,
    Guid? ReferenceVersionId,
    string? UserInstruction,
    string RuleSetSnapshotJson,
    string CriterionSnapshotJson,
    string SourceSnapshotJson,
    string ToolTraceJson,
    string ModelId,
    string PromptVersion,
    ComparisonRunStatus Status,
    ComparisonOutcome? Outcome,
    decimal? ScorePercent,
    decimal PassingThreshold,
    bool HasCriticalFailure,
    string? OutcomeExplanation,
    ComparisonApprovalStatus ApprovalStatus,
    string? ExpertReviewedByUserId,
    DateTime? ExpertReviewedAtUtc,
    string? ExpertReviewNote,
    string? FailureReason,
    string CreatedByUserId,
    DateTime CreatedAtUtc,
    DateTime? CompletedAtUtc,
    IReadOnlyCollection<ComparisonFindingResponse> Findings);
