using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Settings.Commands;
using NegareshAI.Api.Application.Settings.Queries;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/runtime-settings")]
[Authorize]
[NegareshAccess(NegareshAIAccessFormIds.RuntimeSettings)]
public sealed class RuntimeSettingsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? category, [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListRuntimeSettingsQuery(
            category, pageNumber, pageSize), cancellationToken));

    [HttpPut("{category}/{key}")]
    public async Task<ActionResult<RuntimeSettingResponse>> Upsert(
        string category,
        string key,
        UpsertRuntimeSettingRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UpsertRuntimeSettingCommand(
            category, key, request.ValueJson, request.IsActive), cancellationToken));
}
