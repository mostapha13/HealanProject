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

        protected async Task<IActionResult> SendCommand<TResponse>(IRequest<TResponse> request)
        {
            if (request is null)
                return BadRequest(new { message = "داده‌های درخواست نامعتبر است" });
            return Ok(await Mediator.Send(request));
        }
    }
}
