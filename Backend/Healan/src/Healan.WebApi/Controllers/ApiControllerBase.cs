using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Healan.WebApi.Controllers
{
    [ApiController]
    [Route("Healan/api/v1/[controller]")]
    [Produces("application/json")]
    [Authorize(Policy = "HealanApi")]
    public abstract class ApiControllerBase : ControllerBase
    {
        private IMediator _mediator;
        protected IMediator Mediator => _mediator ??= HttpContext.RequestServices.GetService<IMediator>();
    }
}
