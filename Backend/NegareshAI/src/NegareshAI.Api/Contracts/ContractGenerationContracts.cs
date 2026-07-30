using NegareshAI.Api.Data;

namespace NegareshAI.Api.Contracts;

public sealed record ContractTemplateResponse(
    Guid Id, string Name, string ContractType, int Version, string? Description,
    bool IsActive, DateTime CreatedAtUtc);

public sealed record CreateContractTemplateRequest(
    string Name, string ContractType, string? Description);

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
