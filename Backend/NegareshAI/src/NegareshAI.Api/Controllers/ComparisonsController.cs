using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Comparisons;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/comparisons")]
[Authorize]
[NegareshAccess(NegareshAIAccessFormIds.Comparisons)]
public sealed class ComparisonsController(
    ISender sender,
    NegareshDbContext db,
    ICurrentTenant tenant,
    IComparisonReportGenerator reportGenerator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ComparisonRunSummaryResponse>>> List(
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new ListComparisonRunsQuery(), cancellationToken));

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
        var run = await db.ComparisonRuns.AsNoTracking()
            .Include(item => item.TargetDocument)
            .Include(item => item.Findings)
            .SingleOrDefaultAsync(item =>
                item.Id == id && item.OrganizationId == tenant.OrganizationId,
                cancellationToken);
        if (run is null) return NotFound();
        var content = await reportGenerator.GenerateAsync(
            run, format, cancellationToken);
        var contentType = format == "pdf" ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        return File(content, contentType, $"comparison-{id:N}.{format}");
    }
}
