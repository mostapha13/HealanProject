using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Dashboard.Queries;
using NegareshAI.Api.Contracts;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public sealed class DashboardController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get(
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetDashboardQuery(), cancellationToken));
}
