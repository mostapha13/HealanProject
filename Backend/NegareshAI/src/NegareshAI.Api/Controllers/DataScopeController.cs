using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Data;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/access/data-scopes")]
[Authorize]
public sealed class DataScopeController(ISender sender) : ControllerBase
{
    [HttpGet]
    [NegareshAccess(NegareshAIAccessFormIds.AccessDefinitions)]
    public async Task<ActionResult<PagedResponse<DataScopeRow>>> List(
        [FromQuery] DataScopeResourceType? resourceType,
        [FromQuery] DataScopeSubjectType? subjectType,
        [FromQuery] string? subjectId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListDataScopeQuery(
            resourceType, subjectType, subjectId, pageNumber, pageSize), cancellationToken));

    [HttpPut]
    [NegareshAccess(NegareshAIAccessFormIds.AccessDefinitions)]
    public async Task<IActionResult> Save(
        SaveDataScopeRequest request, CancellationToken cancellationToken)
    {
        await sender.Send(new SaveDataScopeCommand(request.ResourceType,
            request.SubjectType, request.SubjectId, request.GrantedResourceIds,
            request.DeniedResourceIds), cancellationToken);
        return NoContent();
    }
}

public sealed record SaveDataScopeRequest(
    DataScopeResourceType ResourceType,
    DataScopeSubjectType SubjectType,
    string SubjectId,
    IReadOnlyCollection<Guid> GrantedResourceIds,
    IReadOnlyCollection<Guid> DeniedResourceIds);
