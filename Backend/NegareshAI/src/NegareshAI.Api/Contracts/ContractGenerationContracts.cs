using NegareshAI.Api.Data;

namespace NegareshAI.Api.Contracts;

public sealed record ContractTemplateResponse(
    Guid Id, string Name, string ContractType, int Version, string? Description,
    bool IsActive, DateTime CreatedAtUtc, Guid? ContractGroupId = null,
    int? ContractYear = null, DateOnly? EffectiveFrom = null, DateOnly? EffectiveTo = null);

public sealed record CreateContractTemplateRequest(
    string Name, string ContractType, string? Description, Guid? ContractGroupId = null,
    int? ContractYear = null, DateOnly? EffectiveFrom = null, DateOnly? EffectiveTo = null);
public sealed record EffectiveContractTemplateResponse(ContractTemplateResponse? Template, string? Reason);
public sealed record UpdateContractTemplateRequest(string Name, string ContractType, string? Description,
    Guid? ContractGroupId, int? ContractYear, DateOnly? EffectiveFrom, DateOnly? EffectiveTo, bool IsActive);

public sealed record StartContractGenerationRequest(
    Guid ContractId, Guid ContractTemplateId, string UserInstruction,
    IReadOnlyList<Guid>? SourceDocumentIds);

public sealed record ContractGenerationResponse(
    Guid Id, Guid ContractId, Guid BaseDocumentVersionId, Guid ContractTemplateId,
    string UserInstruction, string ChangeSetJson, string SourceSnapshotJson,
    string CalculationSnapshotJson, string DiffJson, string? ClarificationQuestionsJson,
    ContractGenerationStatus Status, string ModelId, string PromptVersion,
    string? GeneratedDocxFileId, string? GeneratedPdfFileId,
    string CreatedByUserId, string? ReviewedByUserId, string? ReviewComment,
    DateTime CreatedAtUtc, DateTime? ReviewedAtUtc);

public sealed record ReviewContractGenerationRequest(bool Approved, string? Comment);

public sealed record StartContractConversationRequest(
    Guid? OrganizationPartyId, Guid? PrimaryContractGroupId, int? ContractYear,
    string? Subject, string Message, IReadOnlyList<Guid>? AdditionalSourceContractIds = null);
public sealed record SendContractConversationMessageRequest(string Message);
public sealed record ReviewContractDraftRequest(bool Approved, string? Note);
public sealed record ContractConversationListItemResponse(
    Guid Id, string Title, string PartyName, string GroupName, int ContractYear,
    ContractConversationStatus Status, int DraftCount, DateTime UpdatedAtUtc);
public sealed record ContractConversationMessageResponse(
    Guid Id, int Sequence, ContractMessageRole Role, string Content,
    string? SourceSnapshotJson, DateTime CreatedAtUtc);
public sealed record ContractClarificationResponse(
    Guid Id, string Key, string Question, string? Answer, bool IsAnswered);
public sealed record ContractDraftVersionResponse(
    Guid Id, int VersionNumber, Guid? BaseContractId, Guid? BaseDocumentVersionId,
    Guid ContractTemplateId, string InstructionSnapshot, string ChangeSetJson,
    string SourceSnapshotJson, string CalculationSnapshotJson, string DiffJson,
    string ConflictAnalysisJson,
    string GeneratedDocxFileId, string? GeneratedPdfFileId,
    ContractDraftApprovalStatus ApprovalStatus, Guid? FinalDocumentVersionId,
    DateTime CreatedAtUtc);
public sealed record ContractConversationResponse(
    Guid Id, string Title, Guid OrganizationPartyId, string PartyName,
    Guid PrimaryContractGroupId, string GroupName, int ContractYear, string Subject,
    Guid? BaseContractId, ContractConversationStatus Status,
    IReadOnlyList<ContractConversationMessageResponse> Messages,
    IReadOnlyList<ContractClarificationResponse> Clarifications,
    IReadOnlyList<ContractDraftVersionResponse> Drafts, DateTime UpdatedAtUtc);
public sealed record ContractSourceOptionResponse(Guid ContractId, Guid DocumentId,
    string Subject, string? ContractNumber, string PartyName, Guid PrimaryContractGroupId,
    string GroupName, int? ContractYear, Guid FinalVersionId);
