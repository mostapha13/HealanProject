using NegareshAI.Api.Data;

namespace NegareshAI.Api.Contracts;

public sealed record ContractPartyRequest(
    ContractPartyRole Role,
    string Name,
    string? NationalIdentifier,
    string? RepresentativeName,
    Guid? DirectoryPartyId = null);

public sealed record ContractPartyResponse(
    Guid Id,
    Guid? DirectoryPartyId,
    ContractPartyRole Role,
    string Name,
    string? NationalIdentifier,
    string? RepresentativeName);

public sealed record SaveContractRequest(
    Guid DocumentId,
    string? ContractNumber,
    string Subject,
    ContractStatus Status,
    decimal? Amount,
    string Currency,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? InternalOwnerUserId,
    IReadOnlyList<ContractPartyRequest> Parties,
    Guid? BaseDocumentProfileId = null,
    Guid? StatusDefinitionId = null,
    IReadOnlyList<Guid>? ContractGroupIds = null,
    Guid? PrimaryContractGroupId = null);

public sealed record ContractListItemResponse(
    Guid Id,
    Guid DocumentId,
    string Subject,
    string? ContractNumber,
    ContractStatus Status,
    Guid? StatusDefinitionId,
    string? StatusName,
    decimal? Amount,
    string Currency,
    DateOnly? StartDate,
    DateOnly? EndDate,
    int PartyCount,
    DateTime UpdatedAtUtc);

public sealed record ContractListResponse(
    IReadOnlyList<ContractListItemResponse> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record ContractDetailResponse(
    Guid Id,
    Guid DocumentId,
    string Subject,
    string? ContractNumber,
    ContractStatus Status,
    Guid? StatusDefinitionId,
    string? StatusName,
    Guid? BaseDocumentProfileId,
    Guid? PrimaryContractGroupId,
    IReadOnlyList<Guid> ContractGroupIds,
    decimal? Amount,
    string Currency,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? InternalOwnerUserId,
    IReadOnlyList<ContractPartyResponse> Parties,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
