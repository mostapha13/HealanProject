using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Knowledge;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/knowledge")]
[Authorize]
[NegareshAccess(NegareshAIAccessFormIds.Knowledge)]
public sealed class KnowledgeController(ISender sender) : ControllerBase
{
    [HttpGet("document-groups")]
    public async Task<IActionResult> ListGroups(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListDocumentGroupsQuery(
            pageNumber, pageSize), cancellationToken));

    [HttpPost("document-groups")]
    public async Task<ActionResult<DocumentGroupResponse>> CreateGroup(
        CreateDocumentGroupRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateDocumentGroupCommand(request), cancellationToken);
        return result is null ? BadRequest("One or more documents are unavailable.")
            : Created($"/api/knowledge/document-groups/{result.Id}", result);
    }

    [HttpGet("rule-sets")]
    public async Task<IActionResult> ListRuleSets(
        [FromQuery] Guid? documentGroupId, [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListRuleSetsQuery(
            documentGroupId, pageNumber, pageSize), cancellationToken));

    [HttpPost("rule-sets")]
    public async Task<ActionResult<RuleSetResponse>> CreateRuleSet(
        CreateRuleSetRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateRuleSetCommand(request), cancellationToken);
        return result is null ? BadRequest("The document group is unavailable.")
            : Created($"/api/knowledge/rule-sets/{result.Id}", result);
    }
}
