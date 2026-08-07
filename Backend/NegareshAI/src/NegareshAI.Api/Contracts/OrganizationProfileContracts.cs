namespace NegareshAI.Api.Contracts;

public sealed record OrganizationProfileResponse(
    Guid Id,
    string Name,
    string? ChiefExecutiveName,
    string? ChiefExecutiveFatherName,
    string? ChiefExecutiveNationalId,
    string? NationalIdentifier,
    string? EconomicCode,
    string? RegistrationNumber,
    string? Address,
    string? PostalCode,
    string? Phone,
    string? Fax,
    string? Email,
    string? Website,
    DateTime? UpdatedAtUtc);

public sealed record SaveOrganizationProfileRequest(
    string Name,
    string ChiefExecutiveName,
    string ChiefExecutiveFatherName,
    string ChiefExecutiveNationalId,
    string NationalIdentifier,
    string EconomicCode,
    string Address,
    string Phone,
    string? RegistrationNumber,
    string? PostalCode,
    string? Fax,
    string? Email,
    string? Website);
