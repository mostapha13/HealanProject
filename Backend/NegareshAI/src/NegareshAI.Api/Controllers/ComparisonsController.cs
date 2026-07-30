using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Comparisons;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/comparisons")]
[Authorize]
[NegareshAccess(NegareshAIAccessFormIds.Comparisons)]
public sealed class ComparisonsController(
    ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(
            new ListComparisonRunsQuery(pageNumber, pageSize), cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ComparisonRunResponse>> Get(
        Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetComparisonRunQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ComparisonRunResponse>> Start(
        StartComparisonRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new StartComparisonCommand(request), cancellationToken);
        return result is null
            ? BadRequest("One or more selected sources are unavailable.")
            : CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpPut("findings/{findingId:guid}/review")]
    public async Task<ActionResult<ComparisonFindingResponse>> Review(
        Guid findingId, ReviewFindingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new ReviewFindingCommand(findingId, request), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:guid}/report.{format}")]
    public async Task<IActionResult> Report(
        Guid id, string format, CancellationToken cancellationToken)
    {
        format = format.ToLowerInvariant();
        if (format is not ("docx" or "pdf"))
            return BadRequest("Report format must be docx or pdf.");
        var result = await sender.Send(
            new GenerateComparisonReportQuery(id, format), cancellationToken);
        return result is null
            ? NotFound()
            : File(result.Content, result.ContentType, result.FileName);
    }
}
