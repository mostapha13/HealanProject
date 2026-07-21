using Microsoft.AspNetCore.Http;
using Share.Application.Common.Interfaces;
using Share.Domain.Constants;
using Share.Domain.Enums;
using System;
using System.Linq;
using System.Security.Claims;

namespace Share.Infrastructure.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid UserId
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;
                if (user?.Identity?.IsAuthenticated != true)
                    return Guid.Empty;

                // IdentityServer / JWT may expose subject under several claim types
                // depending on inbound claim mapping and authentication handler.
                var candidates = new[]
                {
                    user.FindFirstValue("sub"),
                    user.FindFirstValue(ClaimTypes.NameIdentifier),
                    user.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"),
                    user.FindFirstValue("nameid"),
                    user.Identity?.Name
                };

                foreach (var raw in candidates)
                {
                    if (Guid.TryParse(raw, out var id) && id != Guid.Empty)
                        return id;
                }

                // Last resort: any claim whose value is a Guid and type looks like subject/id.
                foreach (var claim in user.Claims)
                {
                    if (!Guid.TryParse(claim.Value, out var id) || id == Guid.Empty)
                        continue;

                    var t = claim.Type ?? string.Empty;
                    if (t is "sub" or "nameid"
                        || t.EndsWith("nameidentifier", StringComparison.OrdinalIgnoreCase)
                        || t.Equals(ClaimTypes.NameIdentifier, StringComparison.Ordinal))
                        return id;
                }

                return Guid.Empty;
            }
        }

        public DepartmentId DepartmentId
        {
            get
            {
                object? result = null;
                if (Enum.TryParse(typeof(DepartmentId), _httpContextAccessor.HttpContext?.User?.FindFirstValue(Share.Domain.Constants.WellKnownNames.DepartmentClaimName), out result))
                    return (DepartmentId)result;
                return DepartmentId.None;
            }
        }

        public string AuthTime
        {
            get
            {
                return _httpContextAccessor.HttpContext?.User?.FindFirstValue("auth_time");
            }
        }

        public Guid? ActorUserId => ReadGuidClaim(ImpersonationClaimNames.ActorSubject);

        public Guid? ImpersonationSessionId => ReadGuidClaim(ImpersonationClaimNames.SessionId);

        public bool IsImpersonating =>
            bool.TryParse(
                _httpContextAccessor.HttpContext?.User?.FindFirstValue(ImpersonationClaimNames.IsImpersonating),
                out var result)
            && result;

        private Guid? ReadGuidClaim(string claimType)
        {
            var raw = _httpContextAccessor.HttpContext?.User?.FindFirstValue(claimType);
            return Guid.TryParse(raw, out var value) && value != Guid.Empty ? value : null;
        }
    }
}
