using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Knowledge;
using NegareshAI.Api.Contracts;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/knowledge")]
[Authorize]
public sealed class KnowledgeController(ISender sender) : ControllerBase
{
    [HttpGet("document-groups")]
    public async Task<ActionResult<IReadOnlyList<DocumentGroupResponse>>> ListGroups(
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new ListDocumentGroupsQuery(), cancellationToken));

    [HttpPost("document-groups")]
    public async Task<ActionResult<DocumentGroupResponse>> CreateGroup(
        CreateDocumentGroupRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateDocumentGroupCommand(request), cancellationToken);
        return result is null ? BadRequest("One or more documents are unavailable.")
            : Created($"/api/knowledge/document-groups/{result.Id}", result);
    }

    [HttpGet("rule-sets")]
    public async Task<ActionResult<IReadOnlyList<RuleSetResponse>>> ListRuleSets(
        [FromQuery] Guid? documentGroupId, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new ListRuleSetsQuery(documentGroupId), cancellationToken));

    [HttpPost("rule-sets")]
    public async Task<ActionResult<RuleSetResponse>> CreateRuleSet(
        CreateRuleSetRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateRuleSetCommand(request), cancellationToken);
        return result is null ? BadRequest("The document group is unavailable.")
            : Created($"/api/knowledge/rule-sets/{result.Id}", result);
    }
}
