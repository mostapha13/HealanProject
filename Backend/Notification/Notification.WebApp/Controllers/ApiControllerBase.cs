using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Share.Domain.Constants;

namespace Notification.WebApp.Controllers
{
    [ApiController]
    [Route("WorkFlow/api/v1/[controller]")]
    [Produces("application/json")]

#if DEBUG
    [AllowAnonymous]
#endif
#if !DEBUG
    [Authorize]
#endif
    public abstract class ApiControllerBase : ControllerBase
    {
        private ISender _mediator;
        protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetService<ISender>();
    }
}
