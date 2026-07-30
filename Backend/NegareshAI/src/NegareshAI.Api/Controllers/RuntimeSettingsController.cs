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
    public async Task<ActionResult<IReadOnlyList<RuntimeSettingResponse>>> List(
        [FromQuery] string? category,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new ListRuntimeSettingsQuery(category), cancellationToken));

    [HttpPut("{category}/{key}")]
    public async Task<ActionResult<RuntimeSettingResponse>> Upsert(
        string category,
        string key,
        UpsertRuntimeSettingRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UpsertRuntimeSettingCommand(
            category, key, request.ValueJson, request.IsActive), cancellationToken));
}
