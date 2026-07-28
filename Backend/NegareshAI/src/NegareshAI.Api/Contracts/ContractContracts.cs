using NegareshAI.Api.Data;

namespace NegareshAI.Api.Contracts;

public sealed record ContractPartyRequest(
    ContractPartyRole Role,
    string Name,
    string? NationalIdentifier,
    string? RepresentativeName);

public sealed record ContractPartyResponse(
    Guid Id,
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
    IReadOnlyList<ContractPartyRequest> Parties);

public sealed record ContractListItemResponse(
    Guid Id,
    Guid DocumentId,
    string Subject,
    string? ContractNumber,
    ContractStatus Status,
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
    decimal? Amount,
    string Currency,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? InternalOwnerUserId,
    IReadOnlyList<ContractPartyResponse> Parties,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
