using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.MasterData;

public sealed record GetOrganizationProfileQuery : IRequest<OrganizationProfileResponse?>;
public sealed record SaveOrganizationProfileCommand(SaveOrganizationProfileRequest Request)
    : IRequest<OrganizationProfileResponse?>;

public sealed class OrganizationProfileHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<GetOrganizationProfileQuery, OrganizationProfileResponse?>,
      IRequestHandler<SaveOrganizationProfileCommand, OrganizationProfileResponse?>
{
    public async Task<OrganizationProfileResponse?> Handle(
        GetOrganizationProfileQuery request, CancellationToken cancellationToken)
    {
        var organization = await db.Organizations.AsNoTracking().SingleOrDefaultAsync(
            x => x.Id == tenant.OrganizationId, cancellationToken);
        return organization is null ? null : Map(organization);
    }

    public async Task<OrganizationProfileResponse?> Handle(
        SaveOrganizationProfileCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        if (RequiredValues(request).Any(string.IsNullOrWhiteSpace)) return null;
        var chiefExecutiveNationalId = DigitsOnly(request.ChiefExecutiveNationalId);
        var nationalIdentifier = DigitsOnly(request.NationalIdentifier);
        var economicCode = DigitsOnly(request.EconomicCode);
        var postalCode = DigitsOnly(request.PostalCode);
        if (string.IsNullOrWhiteSpace(chiefExecutiveNationalId)
            || string.IsNullOrWhiteSpace(nationalIdentifier)
            || string.IsNullOrWhiteSpace(economicCode)) return null;

        var organization = await db.Organizations.SingleOrDefaultAsync(
            x => x.Id == tenant.OrganizationId, cancellationToken);
        if (organization is null) return null;

        organization.Name = request.Name.Trim();
        organization.ChiefExecutiveName = request.ChiefExecutiveName.Trim();
        organization.ChiefExecutiveFatherName = request.ChiefExecutiveFatherName.Trim();
        organization.ChiefExecutiveNationalId = chiefExecutiveNationalId;
        organization.NationalIdentifier = nationalIdentifier;
        organization.EconomicCode = economicCode;
        organization.RegistrationNumber = Clean(request.RegistrationNumber);
        organization.Address = request.Address.Trim();
        organization.PostalCode = postalCode;
        organization.Phone = Clean(request.Phone);
        organization.Fax = Clean(request.Fax);
        organization.Email = Clean(request.Email);
        organization.Website = Clean(request.Website);
        organization.UpdatedAtUtc = DateTime.UtcNow;
        organization.UpdatedByUserId = tenant.UserId;

        audit.Add("organization-profile.updated", nameof(Organization), organization.Id.ToString());
        await db.SaveChangesAsync(cancellationToken);
        return Map(organization);
    }

    private static IEnumerable<string?> RequiredValues(SaveOrganizationProfileRequest request)
    {
        yield return request.Name;
        yield return request.ChiefExecutiveName;
        yield return request.ChiefExecutiveFatherName;
        yield return request.ChiefExecutiveNationalId;
        yield return request.NationalIdentifier;
        yield return request.EconomicCode;
        yield return request.Address;
        yield return request.Phone;
    }

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? DigitsOnly(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var normalized = value.Trim()
            .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2')
            .Replace('۳', '3').Replace('۴', '4').Replace('۵', '5')
            .Replace('۶', '6').Replace('۷', '7').Replace('۸', '8').Replace('۹', '9')
            .Replace('٠', '0').Replace('١', '1').Replace('٢', '2')
            .Replace('٣', '3').Replace('٤', '4').Replace('٥', '5')
            .Replace('٦', '6').Replace('٧', '7').Replace('٨', '8').Replace('٩', '9');
        return new string(normalized.Where(char.IsDigit).ToArray());
    }

    internal static OrganizationProfileResponse Map(Organization organization) => new(
        organization.Id, organization.Name, organization.ChiefExecutiveName,
        organization.ChiefExecutiveFatherName, organization.ChiefExecutiveNationalId,
        organization.NationalIdentifier, organization.EconomicCode,
        organization.RegistrationNumber, organization.Address, organization.PostalCode,
        organization.Phone, organization.Fax, organization.Email, organization.Website,
        organization.UpdatedAtUtc);
}
