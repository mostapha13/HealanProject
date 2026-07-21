using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Share.Domain.Constants;

namespace Share.Infrastructure.CustomAttributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false, Inherited = true)]
    public sealed class DisallowImpersonationAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            if (string.Equals(
                context.HttpContext.User.FindFirst(ImpersonationClaimNames.IsImpersonating)?.Value,
                "true",
                StringComparison.OrdinalIgnoreCase))
            {
                context.Result = new StatusCodeResult(403);
            }
        }
    }
}
