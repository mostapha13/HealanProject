using IdentityServer4.Services;

namespace IdentityServer.Services
{
    /// <summary>
    /// Allows configured origins plus any localhost/127.0.0.1/[::1] port (Expo web often
    /// falls back to 8083/8084 when 8082 is busy — otherwise browser shows "Failed to fetch").
    /// </summary>
    public sealed class HealanCorsPolicyService : ICorsPolicyService
    {
        private readonly HashSet<string> _configured;

        public HealanCorsPolicyService(IConfiguration configuration)
        {
            _configured = (configuration["IdentityServer:AllowedCorsOrigins"] ?? string.Empty)
                .Split(',')
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }

        public Task<bool> IsOriginAllowedAsync(string origin)
        {
            if (string.IsNullOrWhiteSpace(origin))
            {
                return Task.FromResult(false);
            }

            if (_configured.Contains(origin))
            {
                return Task.FromResult(true);
            }

            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
            {
                return Task.FromResult(false);
            }

            var host = uri.Host.Trim('[', ']');
            if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
                || host.Equals("::1", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
    }
}
