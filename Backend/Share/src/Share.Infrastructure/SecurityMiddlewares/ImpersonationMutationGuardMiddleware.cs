using Microsoft.AspNetCore.Http;
using Share.Domain.Constants;
using System;
using System.Threading.Tasks;

namespace Share.Infrastructure.SecurityMiddlewares
{
    public sealed class ImpersonationMutationGuardMiddleware
    {
        private readonly RequestDelegate _next;

        public ImpersonationMutationGuardMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var isUnsafeMethod = HttpMethods.IsPost(context.Request.Method)
                || HttpMethods.IsPut(context.Request.Method)
                || HttpMethods.IsPatch(context.Request.Method)
                || HttpMethods.IsDelete(context.Request.Method);
            var isImpersonating = string.Equals(
                context.User.FindFirst(ImpersonationClaimNames.IsImpersonating)?.Value,
                "true",
                StringComparison.OrdinalIgnoreCase);

            if (isUnsafeMethod && isImpersonating)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsync(
                    "{\"title\":\"Impersonated sessions cannot perform identity mutations.\",\"status\":403}");
                return;
            }

            await _next(context);
        }
    }
}
