using IdentityServer4;
using IdentityServer4.Models;
using Microsoft.Extensions.Configuration;

namespace IdentityServer;

/// <summary>
/// IdentityServer contracts owned by SemanticAI. The web client is a confidential
/// BFF client and all secrets must be supplied by an environment-specific secret store.
/// User organization claims must come from the user profile/claims pipeline; the
/// optional default organization is applied only to machine clients.
/// </summary>
public static class SemanticAIIdentityConfiguration
{
    public const string ApiScopeName = "SemanticAI";
    public const string ApiResourceName = "SemanticAIWebApi";
    public const string WebClientId = "SemanticAIWeb";
    public const string ServiceClientId = "SemanticAIService";
    public const string TrayClientId = "SemanticAITray";

    public static IEnumerable<Client> GetClients(IConfiguration configuration)
    {
        var defaultOrganizationId = configuration["IdentityServer:SemanticAIDefaultOrganizationId"]?.Trim();
        var clients = new List<Client>
        {
            new Client
            {
                ClientId = WebClientId,
                ClientName = "SemanticAI Web BFF",
                RequirePkce = true,
                RequireClientSecret = false,
                AllowedGrantTypes = GrantTypes.Code,
                AllowOfflineAccess = true,
                AccessTokenLifetime = 60 * 15,
                AbsoluteRefreshTokenLifetime = 60 * 60 * 8,
                SlidingRefreshTokenLifetime = 60 * 60,
                RefreshTokenUsage = TokenUsage.OneTimeOnly,
                RefreshTokenExpiration = TokenExpiration.Sliding,
                RedirectUris = Split(
                    configuration["IdentityServer:SemanticAIRedirectUris"],
                    "http://localhost:8098/api/auth/callback,http://0.0.0.0:3000/api/auth/callback"),
                PostLogoutRedirectUris = Split(
                    configuration["IdentityServer:SemanticAIPostLogoutRedirectUris"],
                    "http://localhost:8098,http://0.0.0.0:3000"),
                AllowedCorsOrigins = Split(
                    configuration["IdentityServer:SemanticAIAllowedCorsOrigins"],
                    "http://localhost:8098,http://0.0.0.0:3000"),
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    IdentityServerConstants.StandardScopes.OfflineAccess,
                    ApiScopeName,
                    "Content_Producer"
                }
            }
        };

        AddMachineClientWhenConfigured(
            clients, configuration, "IdentityServer:SemanticAIServiceClientSecret",
            ServiceClientId, "SemanticAI backend service", "SemanticAIService", defaultOrganizationId);
        AddMachineClientWhenConfigured(
            clients, configuration, "IdentityServer:SemanticAITrayClientSecret",
            TrayClientId, "SemanticAI Power BI Tray Agent", "SemanticAIPowerBiAgent", defaultOrganizationId);
        return clients;
    }

    public static IEnumerable<ApiScope> ApiScopes =>
        new[]
        {
            new ApiScope(ApiScopeName, "SemanticAI platform API")
            {
                UserClaims = { "role", "permission", "organization_id", "organizationId", "org_id", "tenant_id" }
            }
        };

    public static IEnumerable<ApiResource> ApiResources =>
        new[]
        {
            new ApiResource
            {
                Name = ApiResourceName,
                DisplayName = "SemanticAI API",
                Scopes = new List<string> { ApiScopeName, "Content_Producer" },
                UserClaims = new List<string>
                {
                    "role", "permission", "organization_id", "organizationId", "org_id", "tenant_id"
                }
            }
        };

    private static Client MachineClient(
        string clientId,
        string clientName,
        string secret,
        string role,
        string? defaultOrganizationId)
    {
        var claims = new List<ClientClaim> { new("role", role) };
        if (Guid.TryParse(defaultOrganizationId, out var organizationId) && organizationId != Guid.Empty)
        {
            claims.Add(new ClientClaim("organization_id", organizationId.ToString("D")));
        }

        return new Client
        {
            ClientId = clientId,
            ClientName = clientName,
            RequireClientSecret = true,
            ClientSecrets = { new Secret(secret.Sha256()) },
            AllowedGrantTypes = GrantTypes.ClientCredentials,
            AllowOfflineAccess = false,
            AccessTokenLifetime = 60 * 15,
            AlwaysSendClientClaims = true,
            ClientClaimsPrefix = string.Empty,
            Claims = claims,
            AllowedScopes = { ApiScopeName, "Content_Producer" }
        };
    }

    private static void AddMachineClientWhenConfigured(
        ICollection<Client> clients,
        IConfiguration configuration,
        string secretKey,
        string clientId,
        string clientName,
        string role,
        string? defaultOrganizationId)
    {
        var secret = configuration[secretKey]?.Trim();
        if (!string.IsNullOrWhiteSpace(secret))
        {
            clients.Add(MachineClient(clientId, clientName, secret, role, defaultOrganizationId));
        }
    }

    private static List<string> Split(string? value, string fallback)
        => (string.IsNullOrWhiteSpace(value) ? fallback : value)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
}
