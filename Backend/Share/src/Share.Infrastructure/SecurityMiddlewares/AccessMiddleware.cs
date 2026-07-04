using IdentityServer.GrpcClient.Interfaces;
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
#if DEBUG

            await _next(context);
            return;
#endif
            using var scope = _serviceScopeFactory.CreateScope();
            var _identityTool = scope.ServiceProvider.GetRequiredService<IIdentityTool>();
            var _currentUserService = scope.ServiceProvider.GetRequiredService<ICurrentUserService>();
            _logger.LogInformation("Check If User Is Active...");
            if (!await _identityTool.IsUserActive(_currentUserService.UserId))
            {
                var cookies = context.Request.Cookies.Keys.ToList();
                if (cookies.Any())
                {
                    _logger.LogInformation("Remove All Cookie....");
                    foreach (var cookie in cookies)
                    {
                        if (context.Request.Cookies[cookie] != null)
                        {
                            _logger.LogInformation($"Remove Cookie ...");
                            context.Response.Cookies.Delete(cookie);
                        }
                    }
                }


                var details = new CustomProblemDetails()
                {
                    Title = "User Is Not Active",
                    Errors = new string[] { "نام کاربری یا رمز عبور صحیح نیست" }
                };

                context.Response.StatusCode = 456;// StatusCodes.Status403Forbidden; 
                context.Response.ContentType = "application/json";
                var json = JsonSerializer.Serialize(details);
                await context.Response.WriteAsync(json);
                return;
            }
            _logger.LogInformation("Start Check Access");
            bool shouldCopyBody = false;
            try
            {

                var endpoint = context.Features.Get<IEndpointFeature>()?.Endpoint;
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









                // Get the controller and action names

                _logger.LogInformation($"UserId is {_currentUserService.UserId} SystemName {_systemName} AccessFormId  {accessFormIds}");


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
                    _logger.LogInformation($"UserId is {_currentUserService.UserId} Has Not Access");
                    // Return 403 Forbidden
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsync($"Access forbidden for This Action.");
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"CheckAccess Has Exception");
                context.Response.StatusCode = 403;
                await context.Response.WriteAsync($"Access forbidden for This Action For Exception.");
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
    }
}
