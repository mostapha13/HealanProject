using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using IdentityServer4.Validation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;

namespace IdentityServer.Controllers
{
    public sealed class ImpersonationController : ApiControllerBase
    {
        private readonly ITokenValidator _tokenValidator;
        private readonly ApplicationDbContext _dbContext;

        public ImpersonationController(ITokenValidator tokenValidator, ApplicationDbContext dbContext)
        {
            _tokenValidator = tokenValidator;
            _dbContext = dbContext;
        }

        [HttpPost("end")]
        public async Task<IActionResult> End()
        {
            var authorization = Request.Headers.Authorization.ToString();
            if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return Unauthorized();

            var tokenResult = await _tokenValidator.ValidateAccessTokenAsync(authorization["Bearer ".Length..].Trim());
            if (tokenResult.IsError)
                return Unauthorized();

            var isImpersonating = tokenResult.Claims.Any(x =>
                x.Type == ImpersonationClaimNames.IsImpersonating
                && string.Equals(x.Value, "true", StringComparison.OrdinalIgnoreCase));
            var actorValue = tokenResult.Claims.FirstOrDefault(x => x.Type == ImpersonationClaimNames.ActorSubject)?.Value;
            var targetValue = tokenResult.Claims.FirstOrDefault(x => x.Type == "sub")?.Value;
            var sessionValue = tokenResult.Claims.FirstOrDefault(x => x.Type == ImpersonationClaimNames.SessionId)?.Value;

            if (!isImpersonating
                || !Guid.TryParse(actorValue, out var actorUserId)
                || !Guid.TryParse(targetValue, out var targetUserId)
                || !Guid.TryParse(sessionValue, out var sessionId))
            {
                return BadRequest(new { error = "not_impersonating" });
            }

            var startExists = await _dbContext.ImpersonationAudits
                .AnyAsync(x => x.SessionId == sessionId
                    && x.ActorUserId == actorUserId
                    && x.TargetUserId == targetUserId
                    && x.Event == "Start");
            if (!startExists)
                return Unauthorized();

            var endExists = await _dbContext.ImpersonationAudits
                .AnyAsync(x => x.SessionId == sessionId && x.Event == "End");
            if (!endExists)
            {
                _dbContext.ImpersonationAudits.Add(new ImpersonationAudit
                {
                    ActorUserId = actorUserId,
                    TargetUserId = targetUserId,
                    SessionId = sessionId,
                    OccurredAtUtc = DateTime.UtcNow,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    Event = "End",
                });
                await _dbContext.SaveChangesAsync();
            }

            return Ok(new { ended = true, sessionId });
        }
    }
}
