using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Contracts.Commands;
using NegareshAI.Api.Application.Contracts.Queries;
using NegareshAI.Api.Application.Contracts.Generation;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/contracts")]
[Authorize]
public sealed class ContractsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ContractListResponse>> List(
        [FromQuery] string? search, [FromQuery] ContractStatus? status,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListContractsQuery(search, status, page, pageSize),
            cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContractDetailResponse>> Get(
        Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetContractQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ContractDetailResponse>> Create(
        SaveContractRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateContractCommand(request), cancellationToken);
        return result is null ? Conflict("Document not found or already has a contract.")
            : CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ContractDetailResponse>> Update(
        Guid id, SaveContractRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new UpdateContractCommand(id, request), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken) =>
        await sender.Send(new ArchiveContractCommand(id), cancellationToken)
            ? NoContent() : NotFound();

    [HttpGet("templates")]
    public async Task<ActionResult<IReadOnlyList<ContractTemplateResponse>>> Templates(
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new ListContractTemplatesQuery(), cancellationToken));

    [HttpPost("templates")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ContractTemplateResponse>> CreateTemplate(
        [FromForm] ContractTemplateUploadRequest request, CancellationToken cancellationToken)
    {
        if (!request.File.FileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Template must be a DOCX file.");
        var result = await sender.Send(new CreateContractTemplateCommand(
            new(request.Name, request.ContractType, request.Description),
            request.File.OpenReadStream(), request.File.FileName,
            request.File.ContentType), cancellationToken);
        return Ok(result);
    }

    [HttpPost("generations")]
    public async Task<ActionResult<ContractGenerationResponse>> Generate(
        StartContractGenerationRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new StartContractGenerationCommand(request), cancellationToken);
        return result is null ? NotFound("Contract, base version, or template was not found.") : Ok(result);
    }

    [HttpGet("generations/{id:guid}")]
    public async Task<ActionResult<ContractGenerationResponse>> GetGeneration(
        Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetContractGenerationQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("generations/{id:guid}/review")]
    public async Task<ActionResult<ContractGenerationResponse>> ReviewGeneration(
        Guid id, ReviewContractGenerationRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ReviewContractGenerationCommand(id, request),
            cancellationToken);
        return result is null ? Conflict("Generation is not ready for review.") : Ok(result);
    }
}

public sealed class ContractTemplateUploadRequest
{
    public required string Name { get; init; }
    public required string ContractType { get; init; }
    public string? Description { get; init; }
    public required IFormFile File { get; init; }
}
