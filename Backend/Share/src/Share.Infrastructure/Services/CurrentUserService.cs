using Microsoft.AspNetCore.Http;
using Share.Domain.Enums;
using System;
using System.Linq;
using System.Security.Claims;
using Share.Application.Common.Interfaces;

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

                // JWT "sub" is often remapped to NameIdentifier by inbound claim mapping.
                var raw =
                    user.FindFirstValue("sub")
                    ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? user.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

                if (Guid.TryParse(raw, out var result))
                    return result;

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
    }
}
