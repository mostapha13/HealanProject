using System.Security.Claims;

namespace NegareshAI.Api.Application.Common.Tenancy;

public interface ICurrentTenant
{
    Guid OrganizationId { get; }
    string UserId { get; }
}

public sealed class CurrentTenant(
    IHttpContextAccessor httpContextAccessor,
    IConfiguration configuration,
    IHostEnvironment environment) : ICurrentTenant
{
    public string UserId
    {
        get
        {
            var principal = httpContextAccessor.HttpContext?.User;
            var value = principal?.FindFirstValue("sub")
                ?? principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return !string.IsNullOrWhiteSpace(value)
                ? value
                : throw new TenantResolutionException("The authenticated user has no subject identifier.");
        }
    }

    public Guid OrganizationId
    {
        get
        {
            var principal = httpContextAccessor.HttpContext?.User;
            var value = principal?.FindFirstValue("organization_id")
                ?? principal?.FindFirstValue("organizationId")
                ?? principal?.FindFirstValue("tenant_id");

            if (Guid.TryParse(value, out var organizationId) && organizationId != Guid.Empty)
                return organizationId;

            var fallback = configuration["Tenancy:DevelopmentOrganizationId"];
            if (environment.IsDevelopment()
                && Guid.TryParse(fallback, out organizationId)
                && organizationId != Guid.Empty)
            {
                return organizationId;
            }

            throw new TenantResolutionException(
                "The authenticated user has no valid organization claim.");
        }
    }
}

public sealed class TenantResolutionException(string message) : Exception(message);
