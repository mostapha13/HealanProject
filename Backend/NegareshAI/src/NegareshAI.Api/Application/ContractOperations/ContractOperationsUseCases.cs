using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.ContractOperations;

public sealed record StartWorkflowRequest(Guid ContractId, string? LegalUserId,
    string? TechnicalUserId, string? FinancialUserId, string? ManagerialUserId);
public sealed record WorkflowDecisionRequest(WorkflowDecision Decision, string? Comment);
public sealed record RiskChecklistItem(string Code, string Title, int Weight, int Score, string? Note);
public sealed record RiskAssessmentRequest(Guid ContractId,
    IReadOnlyList<RiskChecklistItem> Items, string? Summary);
public sealed record SaveOperationRequest(Guid ContractId, ContractOperationType Type,
    string Title, DateOnly DueDate, decimal? Amount, string Currency,
    int ReminderDaysBefore, string? Description);
public sealed record OperationStatusRequest(ContractOperationStatus Status);

public enum MutationStatus { Success, NotFound, Conflict, Invalid }
public sealed record MutationResult<T>(MutationStatus Status, T? Value = default, string? Message = null);

public sealed record WorkflowRow(Guid Id, Guid ContractId, string Subject,
    WorkflowDecision Status, int CurrentStageOrder, DateTime CreatedAtUtc,
    IReadOnlyList<ContractWorkflowStage> Stages);
public sealed record OperationRow(Guid Id, Guid ContractId, string Subject,
    ContractOperationType Type, string Title, DateOnly DueDate, decimal? Amount,
    string Currency, ContractOperationStatus Status, int ReminderDaysBefore,
    string? Description);
public sealed record UpcomingOperationRow(Guid Id, string Title,
    ContractOperationType Type, DateOnly DueDate, Guid ContractId, string Subject);
public sealed record ManagementDashboardResult(int ActiveContracts,
    int PendingApprovals, int OverdueOperations, int UpcomingOperations,
    int HighRisks, IReadOnlyList<UpcomingOperationRow> Upcoming);

public sealed record ListWorkflowsQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResponse<WorkflowRow>>;
public sealed record StartWorkflowCommand(StartWorkflowRequest Request)
    : IRequest<MutationResult<ContractWorkflow>>;
public sealed record DecideWorkflowCommand(Guid Id, WorkflowDecisionRequest Request)
    : IRequest<MutationResult<ContractWorkflow>>;
public sealed record ListRisksQuery(Guid ContractId, int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResponse<ContractRiskAssessment>>;
public sealed record AssessRiskCommand(RiskAssessmentRequest Request)
    : IRequest<MutationResult<ContractRiskAssessment>>;
public sealed record DeleteRiskCommand(Guid Id) : IRequest<bool>;
public sealed record ListOperationsQuery(Guid? ContractId, int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResponse<OperationRow>>;
public sealed record CreateOperationCommand(SaveOperationRequest Request)
    : IRequest<MutationResult<ContractOperation>>;
public sealed record ChangeOperationStatusCommand(Guid Id, OperationStatusRequest Request)
    : IRequest<bool>;
public sealed record UpdateOperationCommand(Guid Id, SaveOperationRequest Request)
    : IRequest<MutationResult<ContractOperation>>;
public sealed record DeleteOperationCommand(Guid Id) : IRequest<bool>;
public sealed record GetManagementDashboardQuery : IRequest<ManagementDashboardResult>;

public sealed class ContractOperationsUseCaseHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit) :
    IRequestHandler<ListWorkflowsQuery, PagedResponse<WorkflowRow>>,
    IRequestHandler<StartWorkflowCommand, MutationResult<ContractWorkflow>>,
    IRequestHandler<DecideWorkflowCommand, MutationResult<ContractWorkflow>>,
    IRequestHandler<ListRisksQuery, PagedResponse<ContractRiskAssessment>>,
    IRequestHandler<AssessRiskCommand, MutationResult<ContractRiskAssessment>>,
    IRequestHandler<DeleteRiskCommand, bool>,
    IRequestHandler<ListOperationsQuery, PagedResponse<OperationRow>>,
    IRequestHandler<CreateOperationCommand, MutationResult<ContractOperation>>,
    IRequestHandler<ChangeOperationStatusCommand, bool>,
    IRequestHandler<UpdateOperationCommand, MutationResult<ContractOperation>>,
    IRequestHandler<DeleteOperationCommand, bool>,
    IRequestHandler<GetManagementDashboardQuery, ManagementDashboardResult>
{
    public async Task<PagedResponse<WorkflowRow>> Handle(
        ListWorkflowsQuery request, CancellationToken ct) =>
        await db.ContractWorkflows.AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new WorkflowRow(x.Id, x.ContractId, x.Contract!.Subject,
                x.Status, x.CurrentStageOrder, x.CreatedAtUtc,
                x.Stages.OrderBy(s => s.Order).ToArray()))
            .ToPagedResponseAsync(new PageRequest(request.PageNumber, request.PageSize), ct);

    public async Task<MutationResult<ContractWorkflow>> Handle(
        StartWorkflowCommand command, CancellationToken ct)
    {
        var request = command.Request;
        if (!await OwnContract(request.ContractId, ct))
            return new(MutationStatus.NotFound);
        if (await db.ContractWorkflows.AnyAsync(x => x.ContractId == request.ContractId
            && x.OrganizationId == tenant.OrganizationId
            && x.Status == WorkflowDecision.Pending, ct))
            return new(MutationStatus.Conflict, Message:
                "برای این قرارداد گردش کار فعال وجود دارد.");
        var workflow = new ContractWorkflow
        {
            OrganizationId = tenant.OrganizationId,
            ContractId = request.ContractId,
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
        return new(MutationStatus.Success, workflow);
    }

    public async Task<MutationResult<ContractWorkflow>> Handle(
        DecideWorkflowCommand command, CancellationToken ct)
    {
        if (command.Request.Decision == WorkflowDecision.Pending)
            return new(MutationStatus.Invalid);
        var workflow = await db.ContractWorkflows.Include(x => x.Stages)
            .SingleOrDefaultAsync(x => x.Id == command.Id
                && x.OrganizationId == tenant.OrganizationId, ct);
        if (workflow is null) return new(MutationStatus.NotFound);
        var stage = workflow.Stages.SingleOrDefault(
            x => x.Order == workflow.CurrentStageOrder);
        if (stage is null || stage.Decision != WorkflowDecision.Pending)
            return new(MutationStatus.Conflict);
        var now = DateTime.UtcNow;
        stage.Decision = command.Request.Decision;
        stage.Comment = command.Request.Comment?.Trim();
        stage.DecidedByUserId = tenant.UserId;
        stage.DecidedAtUtc = now;
        workflow.UpdatedByUserId = tenant.UserId;
        workflow.UpdatedAtUtc = now;
        if (command.Request.Decision == WorkflowDecision.Approved
            && stage.Order < workflow.Stages.Count) workflow.CurrentStageOrder++;
        else workflow.Status = command.Request.Decision;
        if (command.Request.Decision == WorkflowDecision.Approved
            && stage.Order == workflow.Stages.Count)
        {
            workflow.Status = WorkflowDecision.Approved;
            var contract = await db.Contracts.SingleAsync(
                x => x.Id == workflow.ContractId, ct);
            contract.Status = ContractStatus.Approved;
            contract.UpdatedAtUtc = now;
        }
        audit.Add("WorkflowDecision", nameof(ContractWorkflowStage),
            stage.Id.ToString(), command.Request);
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, workflow);
    }

    public async Task<PagedResponse<ContractRiskAssessment>> Handle(
        ListRisksQuery request, CancellationToken ct) =>
        await db.ContractRiskAssessments.AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId
                && x.ContractId == request.ContractId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToPagedResponseAsync(new PageRequest(request.PageNumber, request.PageSize), ct);

    public async Task<MutationResult<ContractRiskAssessment>> Handle(
        AssessRiskCommand command, CancellationToken ct)
    {
        var request = command.Request;
        if (!await OwnContract(request.ContractId, ct))
            return new(MutationStatus.NotFound);
        var score = Math.Clamp(request.Items.Sum(x => x.Weight * x.Score), 0, 100);
        var item = new ContractRiskAssessment
        {
            OrganizationId = tenant.OrganizationId, ContractId = request.ContractId,
            Score = score,
            Level = score switch
            {
                >= 80 => RiskLevel.Critical, >= 60 => RiskLevel.High,
                >= 30 => RiskLevel.Medium, _ => RiskLevel.Low
            },
            ChecklistJson = JsonSerializer.Serialize(request.Items),
            Summary = request.Summary?.Trim(), CreatedByUserId = tenant.UserId
        };
        db.Add(item);
        audit.Add("RiskAssessed", nameof(ContractRiskAssessment), item.Id.ToString(),
            new { item.Score, item.Level });
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, item);
    }

    public async Task<bool> Handle(DeleteRiskCommand command, CancellationToken ct)
    {
        var item = await db.ContractRiskAssessments.SingleOrDefaultAsync(x =>
            x.Id == command.Id && x.OrganizationId == tenant.OrganizationId, ct);
        if (item is null) return false;
        item.IsDeleted = true;
        item.DeletedByUserId = tenant.UserId;
        item.DeletedAtUtc = DateTime.UtcNow;
        audit.Add("RiskAssessmentDeleted", nameof(ContractRiskAssessment),
            command.Id.ToString());
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<PagedResponse<OperationRow>> Handle(
        ListOperationsQuery request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var overdue = await db.ContractOperations.Where(x =>
            x.OrganizationId == tenant.OrganizationId
            && x.Status == ContractOperationStatus.Pending && x.DueDate < today)
            .ToListAsync(ct);
        foreach (var row in overdue) row.Status = ContractOperationStatus.Overdue;
        if (overdue.Count > 0) await db.SaveChangesAsync(ct);
        var query = db.ContractOperations.AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId);
        if (request.ContractId.HasValue)
            query = query.Where(x => x.ContractId == request.ContractId);
        return await query.OrderBy(x => x.DueDate)
            .Select(x => new OperationRow(x.Id, x.ContractId, x.Contract!.Subject,
                x.Type, x.Title, x.DueDate, x.Amount, x.Currency, x.Status,
                x.ReminderDaysBefore, x.Description))
            .ToPagedResponseAsync(new PageRequest(request.PageNumber, request.PageSize), ct);
    }

    public async Task<MutationResult<ContractOperation>> Handle(
        CreateOperationCommand command, CancellationToken ct)
    {
        if (!await OwnContract(command.Request.ContractId, ct))
            return new(MutationStatus.NotFound);
        var item = BuildOperation(command.Request);
        db.Add(item);
        audit.Add("OperationCreated", nameof(ContractOperation), item.Id.ToString(),
            command.Request);
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, item);
    }

    public async Task<bool> Handle(
        ChangeOperationStatusCommand command, CancellationToken ct)
    {
        var item = await OwnOperation(command.Id, ct);
        if (item is null) return false;
        item.Status = command.Request.Status;
        Touch(item);
        audit.Add("OperationStatusChanged", nameof(ContractOperation),
            command.Id.ToString(), command.Request);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<MutationResult<ContractOperation>> Handle(
        UpdateOperationCommand command, CancellationToken ct)
    {
        var item = await OwnOperation(command.Id, ct);
        if (item is null) return new(MutationStatus.NotFound);
        if (!await OwnContract(command.Request.ContractId, ct))
            return new(MutationStatus.Invalid);
        Apply(item, command.Request);
        Touch(item);
        audit.Add("OperationUpdated", nameof(ContractOperation),
            command.Id.ToString(), command.Request);
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, item);
    }

    public async Task<bool> Handle(DeleteOperationCommand command, CancellationToken ct)
    {
        var item = await OwnOperation(command.Id, ct);
        if (item is null) return false;
        item.IsDeleted = true;
        item.DeletedByUserId = tenant.UserId;
        item.DeletedAtUtc = DateTime.UtcNow;
        audit.Add("OperationDeleted", nameof(ContractOperation), command.Id.ToString());
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<ManagementDashboardResult> Handle(
        GetManagementDashboardQuery request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var until = today.AddDays(30);
        var operations = db.ContractOperations.Where(
            x => x.OrganizationId == tenant.OrganizationId);
        var workflows = db.ContractWorkflows.Where(
            x => x.OrganizationId == tenant.OrganizationId);
        var risks = db.ContractRiskAssessments.Where(
            x => x.OrganizationId == tenant.OrganizationId);
        return new(
            await db.Contracts.CountAsync(x => x.OrganizationId == tenant.OrganizationId
                && x.Status == ContractStatus.Active, ct),
            await workflows.CountAsync(x => x.Status == WorkflowDecision.Pending, ct),
            await operations.CountAsync(x => x.Status == ContractOperationStatus.Overdue
                || (x.Status == ContractOperationStatus.Pending && x.DueDate < today), ct),
            await operations.CountAsync(x => x.Status == ContractOperationStatus.Pending
                && x.DueDate >= today && x.DueDate <= until, ct),
            await risks.CountAsync(x => x.Level == RiskLevel.High
                || x.Level == RiskLevel.Critical, ct),
            await operations.AsNoTracking().Where(x =>
                    x.Status == ContractOperationStatus.Pending
                    && x.DueDate >= today && x.DueDate <= until)
                .OrderBy(x => x.DueDate).Take(20)
                .Select(x => new UpcomingOperationRow(x.Id, x.Title, x.Type,
                    x.DueDate, x.ContractId, x.Contract!.Subject)).ToListAsync(ct));
    }

    private Task<bool> OwnContract(Guid id, CancellationToken ct) =>
        db.Contracts.AnyAsync(x => x.Id == id
            && x.OrganizationId == tenant.OrganizationId, ct);
    private Task<ContractOperation?> OwnOperation(Guid id, CancellationToken ct) =>
        db.ContractOperations.SingleOrDefaultAsync(x => x.Id == id
            && x.OrganizationId == tenant.OrganizationId, ct);
    private ContractOperation BuildOperation(SaveOperationRequest request)
    {
        var item = new ContractOperation
        {
            OrganizationId = tenant.OrganizationId,
            CreatedByUserId = tenant.UserId,
            Title = string.Empty
        };
        Apply(item, request);
        return item;
    }
    private static void Apply(ContractOperation item, SaveOperationRequest request)
    {
        item.ContractId = request.ContractId;
        item.Type = request.Type;
        item.Title = request.Title.Trim();
        item.DueDate = request.DueDate;
        item.Amount = request.Amount;
        item.Currency = request.Currency;
        item.ReminderDaysBefore = Math.Max(0, request.ReminderDaysBefore);
        item.Description = request.Description?.Trim();
    }
    private void Touch(ContractOperation item)
    {
        item.UpdatedByUserId = tenant.UserId;
        item.UpdatedAtUtc = DateTime.UtcNow;
    }
    private static ContractWorkflowStage Stage(
        WorkflowStageType type, int order, string? userId) =>
        new() { Type = type, Order = order, AssignedUserId = userId };
}
