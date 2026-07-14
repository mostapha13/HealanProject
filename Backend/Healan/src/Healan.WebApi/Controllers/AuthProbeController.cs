using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Share.Application.Common.Interfaces;

namespace Healan.WebApi.Controllers
{
    /// <summary>
    /// Public probe to confirm which auth build is live in Docker.
    /// </summary>
    [ApiController]
    [Route("Healan/api/v1/[controller]")]
    [AllowAnonymous]
    public class AuthProbeController : ControllerBase
    {
        private readonly ICurrentUserService _currentUser;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;

        public AuthProbeController(
            ICurrentUserService currentUser,
            IConfiguration configuration,
            IWebHostEnvironment env)
        {
            _currentUser = currentUser;
            _configuration = configuration;
            _env = env;
        }

        [HttpGet]
        public IActionResult Get()
        {
            var auth = Request.Headers.Authorization.ToString();
            var hasBearer = auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);
            return Ok(new
            {
                build = "f28a843-authdiag-v2",
                environment = _env.EnvironmentName,
                identityAuthority = _configuration["IdentityServer:Url"],
                hasBearer,
                isAuthenticated = User?.Identity?.IsAuthenticated == true,
                userId = _currentUser.UserId,
                claimCount = User?.Claims?.Count() ?? 0,
                claimTypes = User?.Claims?.Select(c => c.Type).Distinct().Take(20),
                message = "If you see build=f28a843-authdiag-v2, the new Healan image is live."
            });
        }
    }
}
