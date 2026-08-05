using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.ContractOperations;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController, Route("api/contract-operations"), Authorize]
public sealed class ContractOperationsController(ISender sender) : ControllerBase
{
    [HttpGet("workflow-definitions"), NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> WorkflowDefinitions(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] bool archived = false, CancellationToken ct = default) =>
        Ok(await sender.Send(new ListWorkflowDefinitionsQuery(
            pageNumber, pageSize, archived), ct));

    [HttpPost("workflow-definitions"), NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> CreateWorkflowDefinition(
        SaveWorkflowDefinitionRequest request, CancellationToken ct) =>
        Result(await sender.Send(new SaveWorkflowDefinitionCommand(null, request), ct));

    [HttpPut("workflow-definitions/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> ReviseWorkflowDefinition(
        Guid id, SaveWorkflowDefinitionRequest request, CancellationToken ct) =>
        Result(await sender.Send(new SaveWorkflowDefinitionCommand(id, request), ct));

    [HttpDelete("workflow-definitions/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> DeleteWorkflowDefinition(Guid id, CancellationToken ct) =>
        await sender.Send(new DeleteWorkflowDefinitionCommand(id), ct) ? NoContent() : NotFound();

    [HttpPost("workflow-definitions/{id:guid}/restore")]
    [NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> RestoreWorkflowDefinition(Guid id, CancellationToken ct) =>
        await sender.Send(new RestoreWorkflowDefinitionCommand(id), ct) ? NoContent() : NotFound();

    [HttpGet("workflows"), NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> Workflows(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] bool myWorklistOnly = false, [FromQuery] bool archived = false,
        CancellationToken ct = default) =>
        Ok(await sender.Send(new ListWorkflowsQuery(
            pageNumber, pageSize, myWorklistOnly, archived), ct));

    [HttpPost("workflows"), NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> Start(StartWorkflowRequest request, CancellationToken ct) =>
        Result(await sender.Send(new StartWorkflowCommand(request), ct), created: true);

    [HttpPost("workflows/{id:guid}/decision")]
    [NegareshAccess(NegareshAIAccessFormIds.WorkflowDecision)]
    public async Task<IActionResult> Decide(
        Guid id, WorkflowDecisionRequest request, CancellationToken ct) =>
        Result(await sender.Send(new DecideWorkflowCommand(id, request), ct));

    [HttpPost("workflows/{id:guid}/comments")]
    [NegareshAccess(NegareshAIAccessFormIds.WorkflowDecision)]
    public async Task<IActionResult> Comment(
        Guid id, WorkflowCommentRequest request, CancellationToken ct) =>
        Result(await sender.Send(new CommentWorkflowCommand(id, request), ct));

    [HttpPost("workflows/{id:guid}/delegate")]
    [NegareshAccess(NegareshAIAccessFormIds.WorkflowDecision)]
    public async Task<IActionResult> Delegate(
        Guid id, WorkflowDelegationRequest request, CancellationToken ct) =>
        Result(await sender.Send(new DelegateWorkflowCommand(id, request), ct));

    [HttpDelete("workflows/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> DeleteWorkflow(Guid id, CancellationToken ct) =>
        await sender.Send(new DeleteWorkflowCommand(id), ct) ? NoContent() : NotFound();

    [HttpPost("workflows/{id:guid}/restore")]
    [NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> RestoreWorkflow(Guid id, CancellationToken ct) =>
        await sender.Send(new RestoreWorkflowCommand(id), ct) ? NoContent() : NotFound();

    [HttpGet("risk-checklists"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> RiskChecklists(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] bool archived = false, CancellationToken ct = default) =>
        Ok(await sender.Send(new ListRiskChecklistDefinitionsQuery(
            pageNumber, pageSize, archived), ct));

    [HttpPost("risk-checklists"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> CreateRiskChecklist(
        SaveRiskChecklistDefinitionRequest request, CancellationToken ct) =>
        Result(await sender.Send(new SaveRiskChecklistDefinitionCommand(null, request), ct));

    [HttpPut("risk-checklists/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> ReviseRiskChecklist(
        Guid id, SaveRiskChecklistDefinitionRequest request, CancellationToken ct) =>
        Result(await sender.Send(new SaveRiskChecklistDefinitionCommand(id, request), ct));

    [HttpDelete("risk-checklists/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> DeleteRiskChecklist(Guid id, CancellationToken ct) =>
        await sender.Send(new DeleteRiskChecklistDefinitionCommand(id), ct)
            ? NoContent() : NotFound();

    [HttpPost("risk-checklists/{id:guid}/restore")]
    [NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> RestoreRiskChecklist(Guid id, CancellationToken ct) =>
        await sender.Send(new RestoreRiskChecklistDefinitionCommand(id), ct)
            ? NoContent() : NotFound();

    [HttpGet("risks"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> Risks(
        [FromQuery] Guid? contractId, [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20, [FromQuery] bool archived = false,
        CancellationToken ct = default) => Ok(await sender.Send(
            new ListRisksQuery(contractId, pageNumber, pageSize, archived), ct));

    [HttpGet("risks/{contractId:guid}"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> RisksForContract(
        Guid contractId, [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await sender.Send(new ListRisksQuery(contractId, pageNumber, pageSize), ct));

    [HttpPost("risks"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> Assess(RiskAssessmentRequest request, CancellationToken ct) =>
        Result(await sender.Send(new AssessRiskCommand(request), ct));

    [HttpDelete("risks/{id:guid}"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> DeleteRisk(Guid id, CancellationToken ct) =>
        await sender.Send(new DeleteRiskCommand(id), ct) ? NoContent() : NotFound();

    [HttpPost("risks/{id:guid}/restore"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> RestoreRisk(Guid id, CancellationToken ct) =>
        await sender.Send(new RestoreRiskCommand(id), ct) ? NoContent() : NotFound();

    [HttpGet("items"), NegareshAccess(NegareshAIAccessFormIds.Operations)]
    public async Task<IActionResult> Items(
        [FromQuery] Guid? contractId, [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20, [FromQuery] bool archived = false,
        [FromQuery] bool mineOnly = false, CancellationToken ct = default) =>
        Ok(await sender.Send(new ListOperationsQuery(
            contractId, pageNumber, pageSize, archived, mineOnly), ct));

    [HttpPost("items"), NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Save(SaveOperationRequest request, CancellationToken ct) =>
        Result(await sender.Send(new CreateOperationCommand(request), ct));

    [HttpPut("items/{id:guid}/status")]
    [NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Status(
        Guid id, OperationStatusRequest request, CancellationToken ct) =>
        await sender.Send(new ChangeOperationStatusCommand(id, request), ct)
            ? NoContent() : NotFound();

    [HttpPut("items/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Update(
        Guid id, SaveOperationRequest request, CancellationToken ct) =>
        Result(await sender.Send(new UpdateOperationCommand(id, request), ct));

    [HttpDelete("items/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await sender.Send(new DeleteOperationCommand(id), ct) ? NoContent() : NotFound();

    [HttpPost("items/{id:guid}/restore")]
    [NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Restore(Guid id, CancellationToken ct) =>
        await sender.Send(new RestoreOperationCommand(id), ct) ? NoContent() : NotFound();

    [HttpPost("reminders/process")]
    [NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> ProcessReminders(
        [FromQuery] DateOnly? asOf, CancellationToken ct) =>
        Ok(await sender.Send(new RunOperationRemindersCommand(asOf), ct));

    [HttpGet("dashboard")]
    [NegareshAccess(NegareshAIAccessFormIds.ManagementDashboard)]
    public async Task<IActionResult> Dashboard(CancellationToken ct) =>
        Ok(await sender.Send(new GetManagementDashboardQuery(), ct));

    [HttpGet("reports.csv")]
    [NegareshAccess(NegareshAIAccessFormIds.ManagementDashboard)]
    public async Task<IActionResult> Report(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
    {
        var report = await sender.Send(new GenerateContractOperationsReportQuery(from, to), ct);
        return File(report.Content, report.ContentType, report.FileName);
    }

    private IActionResult Result<T>(MutationResult<T> result, bool created = false) =>
        result.Status switch
        {
            MutationStatus.NotFound => NotFound(),
            MutationStatus.Conflict => Conflict(new { title = result.Message }),
            MutationStatus.Invalid => BadRequest(new { title = result.Message ?? "داده ورودی نامعتبر است." }),
            MutationStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden,
                new { title = result.Message ?? "دسترسی داده‌ای کافی نیست." }),
            _ when created => StatusCode(StatusCodes.Status201Created, result.Value),
            _ => Ok(result.Value)
        };
}
