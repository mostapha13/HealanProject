using NegareshAI.Api.Data;

namespace NegareshAI.Api.Contracts;

public sealed record CreateDocumentGroupRequest(
    string Name,
    string? Description,
    IReadOnlyCollection<Guid> DocumentIds);

public sealed record DocumentGroupResponse(
    Guid Id,
    string Name,
    string? Description,
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
    string? CorrectedReason);

public sealed record ComparisonFindingResponse(
    Guid Id,
    Guid? RuleId,
    FindingType Type,
    int Severity,
    string Title,
    string Reason,
    string? TargetEvidence,
    int? TargetPage,
    string? TargetSection,
    string? ReferenceEvidence,
    int? ReferencePage,
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
    string SourceSnapshotJson,
    string ModelId,
    string PromptVersion,
    ComparisonRunStatus Status,
    ComparisonOutcome? Outcome,
    decimal? ScorePercent,
    string? FailureReason,
    string CreatedByUserId,
    DateTime CreatedAtUtc,
    DateTime? CompletedAtUtc,
    IReadOnlyCollection<ComparisonFindingResponse> Findings);
