using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Dashboard.Queries;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
[NegareshAccess(NegareshAIAccessFormIds.Dashboard)]
public sealed class DashboardController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get(
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetDashboardQuery(), cancellationToken));
}
