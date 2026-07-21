using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using IdentityServer4.Models;
using IdentityServer4.Validation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;
using System.Security.Claims;

namespace IdentityServer.Services
{
    public sealed class ImpersonationGrantValidator : IExtensionGrantValidator
    {
        public const string GrantTypeName = "healan_impersonation";

        private readonly ITokenValidator _tokenValidator;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _dbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ImpersonationGrantValidator(
            ITokenValidator tokenValidator,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext dbContext,
            IHttpContextAccessor httpContextAccessor)
        {
            _tokenValidator = tokenValidator;
            _userManager = userManager;
            _dbContext = dbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public string GrantType => GrantTypeName;

        public async Task ValidateAsync(ExtensionGrantValidationContext context)
        {
            var actorToken = context.Request.Raw.Get("actor_token");
            var targetUserIdValue = context.Request.Raw.Get("target_user_id");

            if (string.IsNullOrWhiteSpace(actorToken)
                || !Guid.TryParse(targetUserIdValue, out var targetUserId)
                || targetUserId == Guid.Empty)
            {
                Reject(context, "actor_token and a valid target_user_id are required.");
                return;
            }

            var tokenResult = await _tokenValidator.ValidateAccessTokenAsync(actorToken);
            if (tokenResult.IsError)
            {
                Reject(context, "The administrator access token is invalid.");
                return;
            }

            if (tokenResult.Claims.Any(x =>
                    x.Type == ImpersonationClaimNames.IsImpersonating
                    && string.Equals(x.Value, "true", StringComparison.OrdinalIgnoreCase)))
            {
                Reject(context, "Chained impersonation is not allowed.");
                return;
            }

            var actorSubject = tokenResult.Claims.FirstOrDefault(x => x.Type == "sub")?.Value
                ?? tokenResult.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(actorSubject, out var actorUserId) || actorUserId == Guid.Empty)
            {
                Reject(context, "The administrator subject is invalid.");
                return;
            }

            var actor = await _userManager.FindByIdAsync(actorUserId.ToString());
            if (actor == null || !actor.IsActive || !await _userManager.IsInRoleAsync(actor, ConstUserInfo.AdminRole))
            {
                Reject(context, "Only an active administrator can impersonate users.");
                return;
            }

            var target = await _userManager.FindByIdAsync(targetUserId.ToString());
            if (target == null || !target.IsActive)
            {
                Reject(context, "The target user does not exist or is inactive.");
                return;
            }

            var targetRoles = await _userManager.GetRolesAsync(target);
            if (targetRoles.Any(x => string.Equals(x, ConstUserInfo.AdminRole, StringComparison.OrdinalIgnoreCase))
                || targetRoles.Any(x => string.Equals(x, ConstUserInfo.AdminUserName, StringComparison.OrdinalIgnoreCase))
                || string.Equals(target.UserName, ConstUserInfo.AdminUserName, StringComparison.OrdinalIgnoreCase))
            {
                Reject(context, "Administrators cannot be impersonated.");
                return;
            }

            var sessionId = Guid.NewGuid();
            _dbContext.ImpersonationAudits.Add(new ImpersonationAudit
            {
                ActorUserId = actorUserId,
                TargetUserId = target.Id,
                SessionId = sessionId,
                OccurredAtUtc = DateTime.UtcNow,
                IpAddress = GetRemoteIpAddress(),
                Event = "Start",
            });
            await _dbContext.SaveChangesAsync();

            var claims = new List<Claim>
            {
                new(ImpersonationClaimNames.ActorSubject, actorUserId.ToString()),
                new(ImpersonationClaimNames.IsImpersonating, "true"),
                new(ImpersonationClaimNames.SessionId, sessionId.ToString()),
                new(WellKnownNames.DepartmentClaimName, ((byte)target.DepartmentId).ToString()),
            };
            claims.AddRange(targetRoles.Select(role => new Claim("role", role)));

            context.Result = new GrantValidationResult(
                target.Id.ToString(),
                GrantTypeName,
                claims);
        }

        private string GetRemoteIpAddress() =>
            _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        private static void Reject(ExtensionGrantValidationContext context, string description)
        {
            context.Result = new GrantValidationResult(TokenRequestErrors.InvalidGrant, description);
        }
    }
}
