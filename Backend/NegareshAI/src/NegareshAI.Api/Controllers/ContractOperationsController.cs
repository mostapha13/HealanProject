using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.ContractOperations;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController, Route("api/contract-operations"), Authorize]
public sealed class ContractOperationsController(ISender sender) : ControllerBase
{
    [HttpGet("workflows"), NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> Workflows(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await sender.Send(new ListWorkflowsQuery(pageNumber, pageSize), ct));

    [HttpPost("workflows"), NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> Start(
        StartWorkflowRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new StartWorkflowCommand(request), ct);
        return result.Status switch
        {
            MutationStatus.NotFound => NotFound(),
            MutationStatus.Conflict => Conflict(new { title = result.Message }),
            _ => CreatedAtAction(nameof(Workflows),
                new { id = result.Value!.Id }, result.Value)
        };
    }

    [HttpPost("workflows/{id:guid}/decision")]
    [NegareshAccess(NegareshAIAccessFormIds.WorkflowDecision)]
    public async Task<IActionResult> Decide(
        Guid id, WorkflowDecisionRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new DecideWorkflowCommand(id, request), ct);
        return result.Status switch
        {
            MutationStatus.NotFound => NotFound(),
            MutationStatus.Invalid => BadRequest(),
            MutationStatus.Conflict => Conflict(),
            _ => Ok(result.Value)
        };
    }

    [HttpGet("risks/{contractId:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> Risks(
        Guid contractId, [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await sender.Send(
            new ListRisksQuery(contractId, pageNumber, pageSize), ct));

    [HttpPost("risks"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> Assess(
        RiskAssessmentRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new AssessRiskCommand(request), ct);
        return result.Status == MutationStatus.NotFound
            ? NotFound() : Ok(result.Value);
    }

    [HttpDelete("risks/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> DeleteRisk(Guid id, CancellationToken ct) =>
        await sender.Send(new DeleteRiskCommand(id), ct)
            ? NoContent() : NotFound();

    [HttpGet("items"), NegareshAccess(NegareshAIAccessFormIds.Operations)]
    public async Task<IActionResult> Items(
        [FromQuery] Guid? contractId, [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await sender.Send(
            new ListOperationsQuery(contractId, pageNumber, pageSize), ct));

    [HttpPost("items")]
    [NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Save(
        SaveOperationRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new CreateOperationCommand(request), ct);
        return result.Status == MutationStatus.NotFound
            ? NotFound() : Ok(result.Value);
    }

    [HttpPut("items/{id:guid}/status")]
    [NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Status(
        Guid id, OperationStatusRequest request, CancellationToken ct) =>
        await sender.Send(new ChangeOperationStatusCommand(id, request), ct)
            ? NoContent() : NotFound();

    [HttpPut("items/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Update(
        Guid id, SaveOperationRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new UpdateOperationCommand(id, request), ct);
        return result.Status switch
        {
            MutationStatus.NotFound => NotFound(),
            MutationStatus.Invalid => BadRequest(),
            _ => Ok(result.Value)
        };
    }

    [HttpDelete("items/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await sender.Send(new DeleteOperationCommand(id), ct)
            ? NoContent() : NotFound();

    [HttpGet("dashboard")]
    [NegareshAccess(NegareshAIAccessFormIds.ManagementDashboard)]
    public async Task<IActionResult> Dashboard(CancellationToken ct) =>
        Ok(await sender.Send(new GetManagementDashboardQuery(), ct));
}
