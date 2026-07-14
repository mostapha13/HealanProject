using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Share.Infrastructure.SecurityMiddlewares
{
    /// <summary>
    /// Always-on auth diagnostics for Docker Production (Console + ILogger).
    /// Decodes Bearer JWT payload WITHOUT trusting it, so we can see iss/aud/sub
    /// even when authentication failed.
    /// </summary>
    public class AuthDiagnosticsMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuthDiagnosticsMiddleware> _logger;

        public AuthDiagnosticsMiddleware(RequestDelegate next, ILogger<AuthDiagnosticsMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value ?? "";
            var isApi = path.Contains("/api/", StringComparison.OrdinalIgnoreCase);
            if (isApi)
            {
                LogRequestAuth(context, path);
            }

            await _next(context);

            if (isApi && context.Response.StatusCode is 401 or 403 or 456)
            {
                var line =
                    $"[AuthDiag] RESPONSE {context.Response.StatusCode} path={path} authenticated={context.User?.Identity?.IsAuthenticated == true}";
                Console.Error.WriteLine(line);
                _logger.LogWarning("{Line}", line);
            }
        }

        private void LogRequestAuth(HttpContext context, string path)
        {
            var authHeader = context.Request.Headers.Authorization.ToString();
            var hasBearer = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);
            var tokenLen = hasBearer ? authHeader.Length - "Bearer ".Length : 0;

            string tokenHints = "(no-bearer)";
            if (hasBearer)
            {
                var raw = authHeader["Bearer ".Length..].Trim();
                tokenHints = DescribeJwt(raw);
            }

            var principalHints = DescribePrincipal(context.User);

            var line =
                $"[AuthDiag] REQUEST path={path} method={context.Request.Method} hasBearer={hasBearer} tokenLen={tokenLen} {tokenHints} | principal={principalHints}";
            Console.WriteLine(line);
            _logger.LogInformation("{Line}", line);
        }

        private static string DescribePrincipal(ClaimsPrincipal? user)
        {
            if (user?.Identity?.IsAuthenticated != true)
                return "unauthenticated";

            var claims = user.Claims.Select(c => $"{ShortType(c.Type)}={Truncate(c.Value, 48)}").Take(12);
            return $"auth=true name={user.Identity.Name ?? "-"} claims=[{string.Join("; ", claims)}]";
        }

        private static string DescribeJwt(string rawToken)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                if (!handler.CanReadToken(rawToken))
                {
                    // Reference / opaque token (introspection path)
                    return $"tokenKind=opaque prefix={Truncate(rawToken, 12)}";
                }

                var jwt = handler.ReadJwtToken(rawToken);
                var iss = jwt.Issuer ?? "-";
                var aud = string.Join(",", jwt.Audiences ?? Array.Empty<string>());
                var sub = jwt.Subject
                    ?? jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value
                    ?? "-";
                var scope = jwt.Claims.FirstOrDefault(c => c.Type == "scope")?.Value ?? "-";
                var exp = jwt.ValidTo.ToUniversalTime().ToString("o");
                return $"tokenKind=jwt iss={iss} aud=[{aud}] sub={sub} scope={scope} expUtc={exp}";
            }
            catch (Exception ex)
            {
                return $"tokenKind=unreadable err={ex.GetType().Name}:{ex.Message}";
            }
        }

        private static string ShortType(string type)
        {
            if (string.IsNullOrEmpty(type)) return "?";
            var i = type.LastIndexOf('/');
            return i >= 0 && i < type.Length - 1 ? type[(i + 1)..] : type;
        }

        private static string Truncate(string value, int max)
        {
            if (string.IsNullOrEmpty(value)) return "";
            return value.Length <= max ? value : value[..max] + "…";
        }
    }
}
