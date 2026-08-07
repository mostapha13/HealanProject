namespace NegareshAI.Api.Contracts;

public sealed record ContractGroupResponse(Guid Id, string Name, string? Description, bool IsActive);
public sealed record SaveContractGroupRequest(string Name, string? Description, bool IsActive = true);
public sealed record ContractYearResponse(Guid Id, int Year, bool IsActive);
public sealed record SaveContractYearRequest(int Year, bool IsActive = true);

public sealed record ContractStatusDefinitionResponse(
    Guid Id, string Name, int Order, string Color, bool IsActive);
public sealed record SaveContractStatusDefinitionRequest(
    string Name, int Order, string? Color, bool IsActive = true);

public sealed record ContractBaseDocumentResponse(
    Guid Id, Guid DocumentId, string Name, string DocumentTitle,
    string? Description, bool IsActive);
public sealed record SaveContractBaseDocumentRequest(
    Guid DocumentId, string Name, string? Description, bool IsActive = true);

public sealed record OrganizationPartyResponse(
    Guid Id, string Name, string? NationalIdentifier, string? RepresentativeName,
    string? ContactInfo, string? Address, bool IsActive);
public sealed record SaveOrganizationPartyRequest(
    string Name, string? NationalIdentifier, string? RepresentativeName,
    string? ContactInfo, string? Address = null, bool IsActive = true);
