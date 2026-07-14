using IdentityServer.GrpcClient.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Filters;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Extensions;
using Share.Infrastructure.CustomAttributes;
using System.Text;
using System.Text.Json;

namespace Share.Infrastructure.SecurityMiddlewares
{
    public class AccessMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly string _systemName = string.Empty;
        private readonly ILogger<AccessMiddleware> _logger;
        public AccessMiddleware(RequestDelegate next, IServiceScopeFactory serviceScopeFactory, string systemName, ILogger<AccessMiddleware> logger)
        {
            _next = next;
            _serviceScopeFactory = serviceScopeFactory;
            _systemName = systemName;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // IMPORTANT: Local Visual Studio runs as DEBUG — this entire security gate is SKIPPED.
            // Docker publishes Release, so Production always enforces auth. That is why clinic
            // "worked locally" but returns 401 on the server with the same token.
#if DEBUG
            _logger.LogDebug("AccessMiddleware SKIPPED (DEBUG build) path={Path}", context.Request.Path.Value);
            await _next(context);
            return;
#endif
            var endpoint = context.Features.Get<IEndpointFeature>()?.Endpoint
                ?? context.GetEndpoint();

            // Public endpoints (e.g. PortalPublic) must not require an active logged-in user.
            if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
            {
                await _next(context);
                return;
            }

            using var scope = _serviceScopeFactory.CreateScope();
            var _identityTool = scope.ServiceProvider.GetRequiredService<IIdentityTool>();
            var _currentUserService = scope.ServiceProvider.GetRequiredService<ICurrentUserService>();
            _logger.LogInformation("AccessMiddleware check path={Path} system={System}", context.Request.Path.Value, _systemName);

            var isAuthenticated = context.User?.Identity?.IsAuthenticated == true;
            var userId = _currentUserService.UserId;

            // Unauthenticated / token rejected / sub claim not mapped → 401
            if (!isAuthenticated || userId == Guid.Empty)
            {
                var claimDump = string.Join("; ",
                    (context.User?.Claims ?? Enumerable.Empty<System.Security.Claims.Claim>())
                        .Take(20)
                        .Select(c => $"{c.Type}={Truncate(c.Value, 40)}"));
                var authHeaderPresent = context.Request.Headers.ContainsKey("Authorization");
                var reason = !authHeaderPresent
                    ? "missing_authorization_header"
                    : !isAuthenticated
                        ? "jwt_not_authenticated"
                        : "userid_empty_despite_authenticated";

                var line =
                    $"[AccessMiddleware] 401 path={context.Request.Path} reason={reason} authHeader={authHeaderPresent} authenticated={isAuthenticated} userId={userId} claims=[{claimDump}]";
                Console.Error.WriteLine(line);
                _logger.LogError("{Line}", line); // Error level so Serilog always emits to docker console

                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                context.Response.Headers["X-Auth-Reason"] = reason;
                context.Response.Headers["X-Auth-Authenticated"] = isAuthenticated ? "1" : "0";
                context.Response.Headers["X-Auth-Has-Bearer"] = authHeaderPresent ? "1" : "0";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new CustomProblemDetails
                {
                    Title = "Unauthorized",
                    Errors = new[]
                    {
                        "نشست کاربری معتبر نیست. دوباره وارد شوید.",
                        // Visible in browser Network tab — proves Release AccessMiddleware ran
                        $"diag:{reason};bearer={authHeaderPresent};authenticated={isAuthenticated};userId={(userId == Guid.Empty ? "empty" : userId.ToString())};claims={claimDump}"
                    }
                }));
                return;
            }

            bool isActive;
            try
            {
                isActive = await _identityTool.IsUserActive(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IsUserActive gRPC failed for {UserId}", userId);
                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new CustomProblemDetails
                {
                    Title = "Identity Unavailable",
                    Errors = new[] { "سرویس احراز هویت در دسترس نیست." }
                }));
                return;
            }

            if (!isActive)
            {
                var cookies = context.Request.Cookies.Keys.ToList();
                if (cookies.Any())
                {
                    _logger.LogInformation("Remove All Cookie....");
                    foreach (var cookie in cookies)
                    {
                        if (context.Request.Cookies[cookie] != null)
                            context.Response.Cookies.Delete(cookie);
                    }
                }

                // Inactive account — client should send user back to login
                context.Response.StatusCode = 456;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new CustomProblemDetails
                {
                    Title = "User Is Not Active",
                    Errors = new[] { "حساب کاربری غیرفعال است." }
                }));
                return;
            }
            _logger.LogInformation("Start Check Access");
            bool shouldCopyBody = false;
            try
            {
                var routeValues = context.Request.RouteValues;
                int languageId = 0;
                var attribute = endpoint?.Metadata.GetMetadata<AccessFormAttribute>();
                int[] accessFormIds = null;
                if (attribute == null)
                {
                    _logger.LogInformation("AccessFormAttribute Not Exists");
                    await _next(context);
                    return;
                }
                accessFormIds = attribute.AccessFormId;
                _logger.LogInformation($"accessFormId is {accessFormIds}");

                if (context.Request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase))
                {
                    if (routeValues.ContainsKey("lang"))
                    {
                        var lang = routeValues["lang"]?.ToString();

                        if (!string.IsNullOrEmpty(lang))
                        {
                            if (lang.Equals("Fa", StringComparison.OrdinalIgnoreCase))
                            {
                                languageId = (int)LanguageId.Fa;
                            }
                            else if (lang.Equals("En", StringComparison.OrdinalIgnoreCase))
                            {
                                languageId = (int)LanguageId.En;
                            }
                        }
                    }
                }
                else if (context.Request.Method.Equals("POST", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var TextBody = await GetBodyRequest(context.Request);
                        shouldCopyBody = true;
                        var jsonData = JsonDocument.Parse(TextBody);

                        var stringLanguageId = FindLanguageId(jsonData.RootElement);
                        if (!string.IsNullOrEmpty(stringLanguageId))
                        {
                            languageId = (int)((LanguageId)Enum.Parse(typeof(LanguageId), stringLanguageId, true));
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"AccessMiddleware Exceprion: {JsonConverter.ConvertToJson(ex.Message)}");
                        await ex.HandleExceptionAsync(context);
                        return;
                    }
                }

                // Healan APIs often have no {lang} route (Dashboard/Stats, Appointment/...).
                // UserHasAccess treats LanguageId==1 as Persian; LanguageId==0 requires
                // HasPersianAccess==false and wrongly denies seeded Persian roles.
                if (languageId == 0)
                    languageId = (int)LanguageId.Fa;

                // Get the controller and action names

                _logger.LogInformation($"UserId is {_currentUserService.UserId} SystemName {_systemName} AccessFormId  {string.Join(",", accessFormIds ?? Array.Empty<int>())} LanguageId={languageId}");


                var request = new IdentityServer.GrpcClient.UserHasAccessRequest()
                {
                    UserId = _currentUserService.UserId.ToString(),
                    LanguageId = languageId,
                };
                foreach (var id in accessFormIds)
                    request.AccessFormId.Add(id);

                var hasAccess = await _identityTool.UserHasAccess(request);
                if (hasAccess != null && !hasAccess.HasAccess)
                {
                    _logger.LogWarning(
                        "Access denied UserId={UserId} forms=[{Forms}] languageId={Lang}",
                        _currentUserService.UserId,
                        string.Join(",", accessFormIds),
                        languageId);
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    context.Response.Headers["X-Auth-Reason"] = "access_form_denied";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new CustomProblemDetails
                    {
                        Title = "Forbidden",
                        Errors = new[]
                        {
                            "دسترسی به این بخش برای نقش شما فعال نیست.",
                            $"diag:access_form_denied;forms={string.Join(",", accessFormIds)};lang={languageId};userId={_currentUserService.UserId}"
                        }
                    }));
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CheckAccess Has Exception");
                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                context.Response.ContentType = "application/json";
                context.Response.Headers["X-Auth-Reason"] = "access_check_exception";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new CustomProblemDetails
                {
                    Title = "Access Check Failed",
                    Errors = new[]
                    {
                        "بررسی دسترسی موقتاً ممکن نیست.",
                        $"diag:access_check_exception;{ex.GetType().Name}:{ex.Message}"
                    }
                }));
                return;
            }
            // Call the next middleware

            //Copy a pointer to the original response body stream
            if (shouldCopyBody)
            {
                var originalBodyStream = context.Response.Body;
                using (var responseBody = new MemoryStream())
                {

                    await _next(context);

                    context.Response.Body = responseBody;

                    await responseBody.CopyToAsync(originalBodyStream);
                }
            }
            else
                await _next(context);
        }
        private async Task<string> GetBodyRequest(HttpRequest request)
        {
            request.EnableBuffering();
            string bodyAsText = string.Empty;
            using (StreamReader reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true))
            {
                bodyAsText = await reader.ReadToEndAsync();
                request.Body.Position = 0;
            }

            return bodyAsText;

        }
        private string FindLanguageId(JsonElement element)
        {
            foreach (var property in element.EnumerateObject())
            {
                // If the property is "language" and contains "id"
                if (property.NameEquals("language") && property.Value.TryGetProperty("id", out var idElement))
                {
                    return idElement.GetString();
                }

                // Recursively search in nested objects
                if (property.Value.ValueKind == JsonValueKind.Object)
                {
                    var result = FindLanguageId(property.Value);
                    if (!string.IsNullOrEmpty(result))
                    {
                        return result;
                    }
                }

                // Recursively search in arrays
                if (property.Value.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in property.Value.EnumerateArray())
                    {
                        if (item.ValueKind == JsonValueKind.Object)
                        {
                            var result = FindLanguageId(item);
                            if (!string.IsNullOrEmpty(result))
                            {
                                return result;
                            }
                        }
                    }
                }
            }

            // Return null if no "language.id" is found
            return null;
        }

        private static string Truncate(string value, int max)
        {
            if (string.IsNullOrEmpty(value)) return "";
            return value.Length <= max ? value : value[..max] + "…";
        }
    }
}
