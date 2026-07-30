using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController, Route("api/contract-operations"), Authorize]
public sealed class ContractOperationsController(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit) : ControllerBase
{
    [HttpGet("workflows"), NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> Workflows(CancellationToken ct) =>
        Ok(await db.ContractWorkflows.AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId)
            .Include(x => x.Contract).Include(x => x.Stages.OrderBy(s => s.Order))
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new { x.Id, x.ContractId, x.Contract!.Subject, x.Status, x.CurrentStageOrder, x.CreatedAtUtc, x.Stages })
            .ToListAsync(ct));

    [HttpPost("workflows"), NegareshAccess(NegareshAIAccessFormIds.Workflows)]
    public async Task<IActionResult> Start([FromBody] StartWorkflowRequest request, CancellationToken ct)
    {
        if (!await db.Contracts.AnyAsync(x => x.Id == request.ContractId && x.OrganizationId == tenant.OrganizationId, ct))
            return NotFound();
        if (await db.ContractWorkflows.AnyAsync(x => x.ContractId == request.ContractId && x.OrganizationId == tenant.OrganizationId && x.Status == WorkflowDecision.Pending, ct))
            return Conflict(new { title = "برای این قرارداد گردش کار فعال وجود دارد." });
        var workflow = new ContractWorkflow
        {
            OrganizationId = tenant.OrganizationId, ContractId = request.ContractId,
            CreatedByUserId = tenant.UserId,
            Stages =
            [
                Stage(WorkflowStageType.Legal, 1, request.LegalUserId),
                Stage(WorkflowStageType.Technical, 2, request.TechnicalUserId),
                Stage(WorkflowStageType.Financial, 3, request.FinancialUserId),
                Stage(WorkflowStageType.Managerial, 4, request.ManagerialUserId)
            ]
        };
        db.Add(workflow);
        audit.Add("WorkflowStarted", nameof(ContractWorkflow), workflow.Id.ToString(), request);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Workflows), new { id = workflow.Id }, workflow);
    }

    [HttpPost("workflows/{id:guid}/decision"), NegareshAccess(NegareshAIAccessFormIds.WorkflowDecision)]
    public async Task<IActionResult> Decide(Guid id, [FromBody] WorkflowDecisionRequest request, CancellationToken ct)
    {
        if (request.Decision is WorkflowDecision.Pending) return BadRequest();
        var workflow = await db.ContractWorkflows.Include(x => x.Stages)
            .SingleOrDefaultAsync(x => x.Id == id && x.OrganizationId == tenant.OrganizationId, ct);
        if (workflow is null) return NotFound();
        var stage = workflow.Stages.SingleOrDefault(x => x.Order == workflow.CurrentStageOrder);
        if (stage is null || stage.Decision != WorkflowDecision.Pending) return Conflict();
        stage.Decision = request.Decision;
        stage.Comment = request.Comment?.Trim();
        stage.DecidedByUserId = tenant.UserId;
        stage.DecidedAtUtc = DateTime.UtcNow;
        workflow.UpdatedByUserId = tenant.UserId;
        workflow.UpdatedAtUtc = DateTime.UtcNow;
        if (request.Decision == WorkflowDecision.Approved && stage.Order < workflow.Stages.Count)
            workflow.CurrentStageOrder++;
        else
            workflow.Status = request.Decision;
        if (request.Decision == WorkflowDecision.Approved && stage.Order == workflow.Stages.Count)
        {
            workflow.Status = WorkflowDecision.Approved;
            var contract = await db.Contracts.SingleAsync(x => x.Id == workflow.ContractId, ct);
            contract.Status = ContractStatus.Approved;
            contract.UpdatedAtUtc = DateTime.UtcNow;
        }
        audit.Add("WorkflowDecision", nameof(ContractWorkflowStage), stage.Id.ToString(), request);
        await db.SaveChangesAsync(ct);
        return Ok(workflow);
    }

    [HttpGet("risks/{contractId:guid}"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> Risks(Guid contractId, CancellationToken ct) =>
        Ok(await db.ContractRiskAssessments.AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId && x.ContractId == contractId)
            .OrderByDescending(x => x.CreatedAtUtc).ToListAsync(ct));

    [HttpPost("risks"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> Assess([FromBody] RiskAssessmentRequest request, CancellationToken ct)
    {
        if (!await db.Contracts.AnyAsync(x => x.Id == request.ContractId && x.OrganizationId == tenant.OrganizationId, ct))
            return NotFound();
        var score = Math.Clamp(request.Items.Sum(x => x.Weight * x.Score), 0, 100);
        var item = new ContractRiskAssessment
        {
            OrganizationId = tenant.OrganizationId, ContractId = request.ContractId,
            Score = score, Level = score switch { >= 80 => RiskLevel.Critical, >= 60 => RiskLevel.High, >= 30 => RiskLevel.Medium, _ => RiskLevel.Low },
            ChecklistJson = JsonSerializer.Serialize(request.Items), Summary = request.Summary?.Trim(),
            CreatedByUserId = tenant.UserId
        };
        db.Add(item);
        audit.Add("RiskAssessed", nameof(ContractRiskAssessment), item.Id.ToString(), new { item.Score, item.Level });
        await db.SaveChangesAsync(ct);
        return Ok(item);
    }

    [HttpDelete("risks/{id:guid}"), NegareshAccess(NegareshAIAccessFormIds.Risk)]
    public async Task<IActionResult> DeleteRisk(Guid id, CancellationToken ct)
    {
        var item = await db.ContractRiskAssessments.SingleOrDefaultAsync(x => x.Id == id && x.OrganizationId == tenant.OrganizationId, ct);
        if (item is null) return NotFound();
        item.IsDeleted = true; item.DeletedByUserId = tenant.UserId; item.DeletedAtUtc = DateTime.UtcNow;
        audit.Add("RiskAssessmentDeleted", nameof(ContractRiskAssessment), id.ToString());
        await db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("items"), NegareshAccess(NegareshAIAccessFormIds.Operations)]
    public async Task<IActionResult> Items([FromQuery] Guid? contractId, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var query = db.ContractOperations.Where(x => x.OrganizationId == tenant.OrganizationId);
        if (contractId.HasValue) query = query.Where(x => x.ContractId == contractId);
        var rows = await query.Include(x => x.Contract).OrderBy(x => x.DueDate).ToListAsync(ct);
        foreach (var row in rows.Where(x => x.Status == ContractOperationStatus.Pending && x.DueDate < today))
            row.Status = ContractOperationStatus.Overdue;
        if (db.ChangeTracker.HasChanges()) await db.SaveChangesAsync(ct);
        return Ok(rows.Select(x => new { x.Id, x.ContractId, x.Contract!.Subject, x.Type, x.Title, x.DueDate, x.Amount, x.Currency, x.Status, x.ReminderDaysBefore, x.Description }));
    }

    [HttpPost("items"), NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Save([FromBody] SaveOperationRequest request, CancellationToken ct)
    {
        if (!await db.Contracts.AnyAsync(x => x.Id == request.ContractId && x.OrganizationId == tenant.OrganizationId, ct))
            return NotFound();
        var item = new ContractOperation
        {
            OrganizationId = tenant.OrganizationId, ContractId = request.ContractId, Type = request.Type,
            Title = request.Title.Trim(), DueDate = request.DueDate, Amount = request.Amount,
            Currency = request.Currency, ReminderDaysBefore = Math.Max(0, request.ReminderDaysBefore),
            Description = request.Description?.Trim(), CreatedByUserId = tenant.UserId
        };
        db.Add(item); audit.Add("OperationCreated", nameof(ContractOperation), item.Id.ToString(), request);
        await db.SaveChangesAsync(ct);
        return Ok(item);
    }

    [HttpPut("items/{id:guid}/status"), NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Status(Guid id, [FromBody] OperationStatusRequest request, CancellationToken ct)
    {
        var item = await db.ContractOperations.SingleOrDefaultAsync(x => x.Id == id && x.OrganizationId == tenant.OrganizationId, ct);
        if (item is null) return NotFound();
        item.Status = request.Status; item.UpdatedByUserId = tenant.UserId; item.UpdatedAtUtc = DateTime.UtcNow;
        audit.Add("OperationStatusChanged", nameof(ContractOperation), id.ToString(), request);
        await db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpPut("items/{id:guid}"), NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveOperationRequest request, CancellationToken ct)
    {
        var item = await db.ContractOperations.SingleOrDefaultAsync(x => x.Id == id && x.OrganizationId == tenant.OrganizationId, ct);
        if (item is null) return NotFound();
        if (!await db.Contracts.AnyAsync(x => x.Id == request.ContractId && x.OrganizationId == tenant.OrganizationId, ct))
            return BadRequest();
        item.ContractId = request.ContractId; item.Type = request.Type; item.Title = request.Title.Trim();
        item.DueDate = request.DueDate; item.Amount = request.Amount; item.Currency = request.Currency;
        item.ReminderDaysBefore = Math.Max(0, request.ReminderDaysBefore); item.Description = request.Description?.Trim();
        item.UpdatedByUserId = tenant.UserId; item.UpdatedAtUtc = DateTime.UtcNow;
        audit.Add("OperationUpdated", nameof(ContractOperation), id.ToString(), request);
        await db.SaveChangesAsync(ct); return Ok(item);
    }

    [HttpDelete("items/{id:guid}"), NegareshAccess(NegareshAIAccessFormIds.OperationsManage)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var item = await db.ContractOperations.SingleOrDefaultAsync(x => x.Id == id && x.OrganizationId == tenant.OrganizationId, ct);
        if (item is null) return NotFound();
        item.IsDeleted = true; item.DeletedByUserId = tenant.UserId; item.DeletedAtUtc = DateTime.UtcNow;
        audit.Add("OperationDeleted", nameof(ContractOperation), id.ToString());
        await db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpGet("dashboard"), NegareshAccess(NegareshAIAccessFormIds.ManagementDashboard)]
    public async Task<IActionResult> Dashboard(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var until = today.AddDays(30);
        var operations = db.ContractOperations.Where(x => x.OrganizationId == tenant.OrganizationId);
        var workflows = db.ContractWorkflows.Where(x => x.OrganizationId == tenant.OrganizationId);
        var risks = db.ContractRiskAssessments.Where(x => x.OrganizationId == tenant.OrganizationId);
        return Ok(new
        {
            ActiveContracts = await db.Contracts.CountAsync(x => x.OrganizationId == tenant.OrganizationId && x.Status == ContractStatus.Active, ct),
            PendingApprovals = await workflows.CountAsync(x => x.Status == WorkflowDecision.Pending, ct),
            OverdueOperations = await operations.CountAsync(x => x.Status == ContractOperationStatus.Overdue || (x.Status == ContractOperationStatus.Pending && x.DueDate < today), ct),
            UpcomingOperations = await operations.CountAsync(x => x.Status == ContractOperationStatus.Pending && x.DueDate >= today && x.DueDate <= until, ct),
            HighRisks = await risks.CountAsync(x => x.Level == RiskLevel.High || x.Level == RiskLevel.Critical, ct),
            Upcoming = await operations.Include(x => x.Contract).Where(x => x.Status == ContractOperationStatus.Pending && x.DueDate >= today && x.DueDate <= until)
                .OrderBy(x => x.DueDate).Take(20).Select(x => new { x.Id, x.Title, x.Type, x.DueDate, x.ContractId, x.Contract!.Subject }).ToListAsync(ct)
        });
    }

    private static ContractWorkflowStage Stage(WorkflowStageType type, int order, string? userId) =>
        new() { Type = type, Order = order, AssignedUserId = userId };
}

public sealed record StartWorkflowRequest(Guid ContractId, string? LegalUserId, string? TechnicalUserId, string? FinancialUserId, string? ManagerialUserId);
public sealed record WorkflowDecisionRequest(WorkflowDecision Decision, string? Comment);
public sealed record RiskChecklistItem(string Code, string Title, int Weight, int Score, string? Note);
public sealed record RiskAssessmentRequest(Guid ContractId, IReadOnlyList<RiskChecklistItem> Items, string? Summary);
public sealed record SaveOperationRequest(Guid ContractId, ContractOperationType Type, string Title, DateOnly DueDate, decimal? Amount, string Currency, int ReminderDaysBefore, string? Description);
public sealed record OperationStatusRequest(ContractOperationStatus Status);
