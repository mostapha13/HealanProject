using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Share.Domain.Constants;

namespace IdentityServer.UserManagerAPI.Controllers
{
    [ApiController]
    [Route("UserManager/api/v1/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public abstract class ApiControllerBase : ControllerBase
    {
        private ISender _mediator;
        protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetService<ISender>();
    }
}
