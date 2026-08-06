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

    [HttpGet("approved-reference-document-ids")]
    public async Task<IActionResult> ApprovedReferenceDocumentIds(
        [FromQuery] Guid documentGroupId, CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new ListApprovedReferenceDocumentIdsQuery(documentGroupId), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ComparisonRunResponse>> Start(
        StartComparisonRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await sender.Send(new StartComparisonCommand(request), cancellationToken);
            return result is null
                ? BadRequest("یکی از منابع انتخاب‌شده موجود یا قابل دسترسی نیست.")
                : CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpPut("findings/{findingId:guid}/review")]
    [NegareshAccess(NegareshAIAccessFormIds.ComparisonReview)]
    public async Task<ActionResult<ComparisonFindingResponse>> Review(
        Guid findingId, ReviewFindingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new ReviewFindingCommand(findingId, request), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/expert-review")]
    [NegareshAccess(NegareshAIAccessFormIds.ComparisonReview)]
    public async Task<ActionResult<ComparisonRunResponse>> ExpertReview(
        Guid id, ReviewComparisonRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await sender.Send(
                new ReviewComparisonCommand(id, request), cancellationToken);
            return result is null ? Conflict("Comparison is not awaiting expert review.") : Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(exception.Message);
        }
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
