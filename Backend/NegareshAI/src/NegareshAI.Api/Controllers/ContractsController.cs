using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Contracts.Commands;
using NegareshAI.Api.Application.Contracts.Queries;
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
}
