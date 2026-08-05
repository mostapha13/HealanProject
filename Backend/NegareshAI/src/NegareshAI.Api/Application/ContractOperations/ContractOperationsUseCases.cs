using System.Text;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.ContractOperations;

public sealed record WorkflowStageDefinitionInput(WorkflowStageType Type, string Title,
    int Order, string? DefaultAssignedUserId);
public sealed record SaveWorkflowDefinitionRequest(string Name, Guid? ContractGroupId,
    IReadOnlyList<WorkflowStageDefinitionInput> Stages, bool IsActive = true);
public sealed record WorkflowDefinitionRow(Guid Id, Guid DefinitionKey, string Name,
    Guid? ContractGroupId, int Version, bool IsActive,
    IReadOnlyList<WorkflowStageDefinitionInput> Stages, DateTime CreatedAtUtc);
public sealed record WorkflowStageAssignment(WorkflowStageType Type, string? AssignedUserId);
public sealed record StartWorkflowRequest(Guid ContractId, string? LegalUserId,
    string? TechnicalUserId, string? FinancialUserId, string? ManagerialUserId,
    Guid? WorkflowDefinitionId = null,
    IReadOnlyList<WorkflowStageAssignment>? StageAssignments = null,
    string? ExpertUserId = null);
public sealed record WorkflowDecisionRequest(WorkflowDecision Decision, string? Comment);
public sealed record WorkflowCommentRequest(string Comment);
public sealed record WorkflowDelegationRequest(string AssignedUserId, string? Comment);
public sealed record WorkflowStageRow(Guid Id, WorkflowStageType Type, string Title,
    int Order, string? AssignedUserId, WorkflowDecision Decision, string? Comment,
    string? DecidedByUserId, DateTime? DecidedAtUtc, string? DelegatedFromUserId);
public sealed record WorkflowActionRow(Guid Id, WorkflowActionType Type, string? Comment,
    string? FromUserId, string? ToUserId, string PerformedByUserId, DateTime PerformedAtUtc);
public sealed record WorkflowRow(Guid Id, Guid ContractId, string Subject,
    Guid? ContractGroupId, WorkflowDecision Status, int CurrentStageOrder,
    DateTime CreatedAtUtc, IReadOnlyList<WorkflowStageRow> Stages,
    IReadOnlyList<WorkflowActionRow> Actions);

public sealed record RiskChecklistItem(string Code, string Title, int Weight, int Score,
    string? Note, bool IsCritical = false);
public sealed record RiskChecklistDefinitionItem(string Code, string Title, int Weight,
    bool IsCritical = false);
public sealed record SaveRiskChecklistDefinitionRequest(string Name, Guid? ContractGroupId,
    IReadOnlyList<RiskChecklistDefinitionItem> Items, bool IsActive = true);
public sealed record RiskChecklistDefinitionRow(Guid Id, Guid DefinitionKey, string Name,
    Guid? ContractGroupId, int Version, bool IsActive,
    IReadOnlyList<RiskChecklistDefinitionItem> Items, DateTime CreatedAtUtc);
public sealed record RiskAssessmentRequest(Guid ContractId,
    IReadOnlyList<RiskChecklistItem> Items, string? Summary,
    Guid? ChecklistDefinitionId = null);
public sealed record RiskAssessmentRow(Guid Id, Guid ContractId, string Subject,
    Guid? ChecklistDefinitionId, int? ChecklistDefinitionVersion, int Version,
    int Score, RiskLevel Level, string? Summary,
    IReadOnlyList<RiskChecklistItem> Items, string CreatedByUserId, DateTime CreatedAtUtc);

public sealed record SaveOperationRequest(Guid ContractId, ContractOperationType Type,
    string Title, DateOnly DueDate, decimal? Amount, string Currency,
    int ReminderDaysBefore, string? Description, string? AssignedUserId = null);
public sealed record OperationStatusRequest(ContractOperationStatus Status);
public sealed record OperationRow(Guid Id, Guid ContractId, string Subject,
    ContractOperationType Type, string Title, DateOnly DueDate, decimal? Amount,
    string Currency, ContractOperationStatus Status, int ReminderDaysBefore,
    string? Description, string? AssignedUserId, string? CompletedByUserId,
    DateTime? CompletedAtUtc);
public sealed record UpcomingOperationRow(Guid Id, string Title,
    ContractOperationType Type, DateOnly DueDate, Guid ContractId, string Subject,
    string? AssignedUserId);
public sealed record ManagementDashboardResult(int ActiveContracts,
    int PendingApprovals, int MyPendingTasks, int OverdueOperations,
    int UpcomingOperations, int HighRisks, IReadOnlyList<UpcomingOperationRow> Upcoming);
public sealed record ReminderRunResult(DateOnly AsOf, int MarkedOverdue,
    int UpcomingQueued, int OverdueQueued, int ExistingSkipped);
public sealed record ContractOperationsReport(byte[] Content, string ContentType, string FileName);

public enum MutationStatus { Success, NotFound, Conflict, Invalid, Forbidden }
public sealed record MutationResult<T>(MutationStatus Status, T? Value = default,
    string? Message = null);

public sealed record ListWorkflowDefinitionsQuery(int PageNumber = 1, int PageSize = 20,
    bool Archived = false) : IRequest<PagedResponse<WorkflowDefinitionRow>>;
public sealed record SaveWorkflowDefinitionCommand(Guid? Id, SaveWorkflowDefinitionRequest Request)
    : IRequest<MutationResult<WorkflowDefinitionRow>>;
public sealed record DeleteWorkflowDefinitionCommand(Guid Id) : IRequest<bool>;
public sealed record RestoreWorkflowDefinitionCommand(Guid Id) : IRequest<bool>;
public sealed record ListWorkflowsQuery(int PageNumber = 1, int PageSize = 20,
    bool MyWorklistOnly = false, bool Archived = false) : IRequest<PagedResponse<WorkflowRow>>;
public sealed record StartWorkflowCommand(StartWorkflowRequest Request)
    : IRequest<MutationResult<WorkflowRow>>;
public sealed record DecideWorkflowCommand(Guid Id, WorkflowDecisionRequest Request)
    : IRequest<MutationResult<WorkflowRow>>;
public sealed record CommentWorkflowCommand(Guid Id, WorkflowCommentRequest Request)
    : IRequest<MutationResult<WorkflowRow>>;
public sealed record DelegateWorkflowCommand(Guid Id, WorkflowDelegationRequest Request)
    : IRequest<MutationResult<WorkflowRow>>;
public sealed record DeleteWorkflowCommand(Guid Id) : IRequest<bool>;
public sealed record RestoreWorkflowCommand(Guid Id) : IRequest<bool>;

public sealed record ListRiskChecklistDefinitionsQuery(int PageNumber = 1, int PageSize = 20,
    bool Archived = false) : IRequest<PagedResponse<RiskChecklistDefinitionRow>>;
public sealed record SaveRiskChecklistDefinitionCommand(Guid? Id,
    SaveRiskChecklistDefinitionRequest Request)
    : IRequest<MutationResult<RiskChecklistDefinitionRow>>;
public sealed record DeleteRiskChecklistDefinitionCommand(Guid Id) : IRequest<bool>;
public sealed record RestoreRiskChecklistDefinitionCommand(Guid Id) : IRequest<bool>;
public sealed record ListRisksQuery(Guid? ContractId, int PageNumber = 1, int PageSize = 20,
    bool Archived = false) : IRequest<PagedResponse<RiskAssessmentRow>>;
public sealed record AssessRiskCommand(RiskAssessmentRequest Request)
    : IRequest<MutationResult<RiskAssessmentRow>>;
public sealed record DeleteRiskCommand(Guid Id) : IRequest<bool>;
public sealed record RestoreRiskCommand(Guid Id) : IRequest<bool>;

public sealed record ListOperationsQuery(Guid? ContractId, int PageNumber = 1,
    int PageSize = 20, bool Archived = false, bool MineOnly = false)
    : IRequest<PagedResponse<OperationRow>>;
public sealed record CreateOperationCommand(SaveOperationRequest Request)
    : IRequest<MutationResult<OperationRow>>;
public sealed record ChangeOperationStatusCommand(Guid Id, OperationStatusRequest Request)
    : IRequest<bool>;
public sealed record UpdateOperationCommand(Guid Id, SaveOperationRequest Request)
    : IRequest<MutationResult<OperationRow>>;
public sealed record DeleteOperationCommand(Guid Id) : IRequest<bool>;
public sealed record RestoreOperationCommand(Guid Id) : IRequest<bool>;
public sealed record RunOperationRemindersCommand(DateOnly? AsOf = null)
    : IRequest<ReminderRunResult>;
public sealed record GetManagementDashboardQuery : IRequest<ManagementDashboardResult>;
public sealed record GenerateContractOperationsReportQuery(DateOnly? From, DateOnly? To)
    : IRequest<ContractOperationsReport>;

public sealed class ContractOperationScope(
    NegareshDbContext db, ICurrentTenant tenant, IDataScopeAuthorizer? authorizer = null)
{
    public async Task<IReadOnlySet<Guid>?> AllowedGroups(CancellationToken ct) =>
        authorizer is null ? null : await authorizer.GetAllowedResourceIdsAsync(
            DataScopeResourceType.ContractGroup, ct);

    public async Task<bool> IsAdmin(CancellationToken ct) =>
        await AllowedGroups(ct) is null;

    public async Task<Contract?> Contract(Guid id, CancellationToken ct)
    {
        var contract = await db.Contracts.Include(x => x.GroupMemberships)
            .SingleOrDefaultAsync(x => x.Id == id
                && x.OrganizationId == tenant.OrganizationId, ct);
        if (contract is null) return null;
        var allowed = await AllowedGroups(ct);
        return allowed is null || contract.GroupMemberships.Any(x =>
            allowed.Contains(x.ContractGroupId)) ? contract : null;
    }

    public async Task<HashSet<Guid>?> AllowedContractIds(CancellationToken ct)
    {
        var allowed = await AllowedGroups(ct);
        if (allowed is null) return null;
        return await db.ContractGroupMemberships.AsNoTracking()
            .Where(x => allowed.Contains(x.ContractGroupId))
            .Select(x => x.ContractId).ToHashSetAsync(ct);
    }

    public static Guid? PrimaryGroup(Contract contract) => contract.GroupMemberships
        .OrderByDescending(x => x.IsPrimary).Select(x => (Guid?)x.ContractGroupId)
        .FirstOrDefault();
}

public sealed class WorkflowDefinitionHandler(
    NegareshDbContext db, ICurrentTenant tenant, ContractOperationScope scope,
    IAuditWriter audit) :
    IRequestHandler<ListWorkflowDefinitionsQuery, PagedResponse<WorkflowDefinitionRow>>,
    IRequestHandler<SaveWorkflowDefinitionCommand, MutationResult<WorkflowDefinitionRow>>,
    IRequestHandler<DeleteWorkflowDefinitionCommand, bool>,
    IRequestHandler<RestoreWorkflowDefinitionCommand, bool>
{
    public async Task<PagedResponse<WorkflowDefinitionRow>> Handle(
        ListWorkflowDefinitionsQuery request, CancellationToken ct)
    {
        var allowed = await scope.AllowedGroups(ct);
        var query = db.ContractWorkflowDefinitions.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId
                && x.IsDeleted == request.Archived);
        if (allowed is not null)
            query = query.Where(x => x.ContractGroupId == null
                || allowed.Contains(x.ContractGroupId.Value));
        var page = await query.OrderBy(x => x.Name).ThenByDescending(x => x.Version)
            .ToPagedResponseAsync(new PageRequest(request.PageNumber, request.PageSize), ct);
        return ConvertPage(page, Map);
    }

    public async Task<MutationResult<WorkflowDefinitionRow>> Handle(
        SaveWorkflowDefinitionCommand command, CancellationToken ct)
    {
        var request = command.Request;
        if (string.IsNullOrWhiteSpace(request.Name) || !ValidStages(request.Stages))
            return new(MutationStatus.Invalid, Message: "مراحل گردش کار نامعتبر هستند.");
        if (request.ContractGroupId is not null && !await CanUseGroup(request.ContractGroupId.Value, ct))
            return new(MutationStatus.Forbidden);
        var current = command.Id is null ? null
            : await db.ContractWorkflowDefinitions.SingleOrDefaultAsync(x =>
                x.Id == command.Id && x.OrganizationId == tenant.OrganizationId, ct);
        if (command.Id is not null && current is null) return new(MutationStatus.NotFound);
        var key = current?.DefinitionKey ?? Guid.NewGuid();
        var version = current is null ? 1 : await db.ContractWorkflowDefinitions
            .IgnoreQueryFilters().Where(x => x.OrganizationId == tenant.OrganizationId
                && x.DefinitionKey == key).MaxAsync(x => x.Version, ct) + 1;
        if (current is not null)
        {
            current.IsActive = false;
            audit.Add("workflow-definition.superseded", nameof(ContractWorkflowDefinition),
                current.Id.ToString(), new { NewVersion = version });
        }
        var entity = new ContractWorkflowDefinition
        {
            OrganizationId = tenant.OrganizationId, DefinitionKey = key,
            ContractGroupId = request.ContractGroupId, Name = request.Name.Trim(),
            Version = version, StagesJson = JsonSerializer.Serialize(
                request.Stages.OrderBy(x => x.Order)), IsActive = request.IsActive,
            CreatedByUserId = tenant.UserId
        };
        db.Add(entity);
        audit.Add("workflow-definition.version-created", nameof(ContractWorkflowDefinition),
            entity.Id.ToString(), new { entity.DefinitionKey, entity.Version, entity.ContractGroupId });
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, Map(entity));
    }

    public Task<bool> Handle(DeleteWorkflowDefinitionCommand command, CancellationToken ct) =>
        SetDeleted(command.Id, true, ct);
    public Task<bool> Handle(RestoreWorkflowDefinitionCommand command, CancellationToken ct) =>
        SetDeleted(command.Id, false, ct);

    private async Task<bool> SetDeleted(Guid id, bool deleted, CancellationToken ct)
    {
        var entity = await db.ContractWorkflowDefinitions.IgnoreQueryFilters()
            .SingleOrDefaultAsync(x => x.Id == id
                && x.OrganizationId == tenant.OrganizationId, ct);
        if (entity is null) return false;
        entity.IsDeleted = deleted;
        entity.IsActive = !deleted;
        entity.DeletedAtUtc = deleted ? DateTime.UtcNow : null;
        entity.DeletedByUserId = deleted ? tenant.UserId : null;
        audit.Add(deleted ? "workflow-definition.deleted" : "workflow-definition.restored",
            nameof(ContractWorkflowDefinition), id.ToString());
        await db.SaveChangesAsync(ct);
        return true;
    }

    private async Task<bool> CanUseGroup(Guid groupId, CancellationToken ct)
    {
        var exists = await db.ContractGroups.AnyAsync(x => x.Id == groupId
            && x.OrganizationId == tenant.OrganizationId && x.IsActive, ct);
        if (!exists) return false;
        var allowed = await scope.AllowedGroups(ct);
        return allowed is null || allowed.Contains(groupId);
    }

    private static bool ValidStages(IReadOnlyList<WorkflowStageDefinitionInput> stages) =>
        stages.Count > 0 && stages.All(x => x.Order > 0 && !string.IsNullOrWhiteSpace(x.Title))
        && stages.Select(x => x.Order).Distinct().Count() == stages.Count;
    private static WorkflowDefinitionRow Map(ContractWorkflowDefinition x) => new(
        x.Id, x.DefinitionKey, x.Name, x.ContractGroupId, x.Version, x.IsActive,
        Parse<WorkflowStageDefinitionInput>(x.StagesJson), x.CreatedAtUtc);
    internal static IReadOnlyList<T> Parse<T>(string json) =>
        JsonSerializer.Deserialize<T[]>(json) ?? [];
    internal static PagedResponse<TOut> ConvertPage<TIn, TOut>(
        PagedResponse<TIn> page, Func<TIn, TOut> map) => new(
        page.Items.Select(map).ToArray(), page.PageNumber, page.PageSize,
        page.TotalCount, page.TotalPages, page.HasPreviousPage, page.HasNextPage);
}

public sealed class WorkflowUseCaseHandler(
    NegareshDbContext db, ICurrentTenant tenant, ContractOperationScope scope,
    IAuditWriter audit) :
    IRequestHandler<ListWorkflowsQuery, PagedResponse<WorkflowRow>>,
    IRequestHandler<StartWorkflowCommand, MutationResult<WorkflowRow>>,
    IRequestHandler<DecideWorkflowCommand, MutationResult<WorkflowRow>>,
    IRequestHandler<CommentWorkflowCommand, MutationResult<WorkflowRow>>,
    IRequestHandler<DelegateWorkflowCommand, MutationResult<WorkflowRow>>,
    IRequestHandler<DeleteWorkflowCommand, bool>,
    IRequestHandler<RestoreWorkflowCommand, bool>
{
    public async Task<PagedResponse<WorkflowRow>> Handle(
        ListWorkflowsQuery request, CancellationToken ct)
    {
        var ids = await scope.AllowedContractIds(ct);
        var admin = ids is null;
        var query = db.ContractWorkflows.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId
                && x.IsDeleted == request.Archived);
        if (ids is not null) query = query.Where(x => ids.Contains(x.ContractId));
        if (request.MyWorklistOnly)
        {
            query = query.Where(x => x.Status == WorkflowDecision.Pending);
            if (!admin) query = query.Where(x => x.Stages.Any(s => s.Order == x.CurrentStageOrder
                    && s.Decision == WorkflowDecision.Pending
                    && s.AssignedUserId == tenant.UserId));
        }
        var page = await query.Include(x => x.Contract).Include(x => x.Stages)
            .Include(x => x.Actions).OrderByDescending(x => x.CreatedAtUtc)
            .AsSplitQuery().ToPagedResponseAsync(
                new PageRequest(request.PageNumber, request.PageSize), ct);
        return WorkflowDefinitionHandler.ConvertPage(page, Map);
    }

    public async Task<MutationResult<WorkflowRow>> Handle(
        StartWorkflowCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var contract = await scope.Contract(request.ContractId, ct);
        if (contract is null) return new(MutationStatus.NotFound);
        if (await db.ContractWorkflows.AnyAsync(x => x.ContractId == request.ContractId
            && x.OrganizationId == tenant.OrganizationId
            && x.Status == WorkflowDecision.Pending, ct))
            return new(MutationStatus.Conflict, Message: "برای این قرارداد گردش کار فعال وجود دارد.");
        var groupId = ContractOperationScope.PrimaryGroup(contract);
        ContractWorkflowDefinition? definition = null;
        IReadOnlyList<WorkflowStageDefinitionInput> stageDefinitions;
        if (request.WorkflowDefinitionId is not null)
        {
            definition = await db.ContractWorkflowDefinitions.AsNoTracking()
                .SingleOrDefaultAsync(x => x.Id == request.WorkflowDefinitionId
                    && x.OrganizationId == tenant.OrganizationId && x.IsActive, ct);
            if (definition is null || definition.ContractGroupId is not null
                && !contract.GroupMemberships.Any(x =>
                    x.ContractGroupId == definition.ContractGroupId))
                return new(MutationStatus.Invalid, Message: "تعریف گردش کار با گروه قرارداد سازگار نیست.");
            stageDefinitions = WorkflowDefinitionHandler.Parse<WorkflowStageDefinitionInput>(
                definition.StagesJson);
        }
        else stageDefinitions = DefaultDefinitions(request);
        var assignments = request.StageAssignments?.ToDictionary(x => x.Type,
            x => x.AssignedUserId) ?? new Dictionary<WorkflowStageType, string?>();
        var workflow = new ContractWorkflow
        {
            OrganizationId = tenant.OrganizationId, ContractId = contract.Id,
            ContractGroupId = groupId, WorkflowDefinitionId = definition?.Id,
            WorkflowDefinitionVersion = definition?.Version,
            DefinitionSnapshotJson = JsonSerializer.Serialize(stageDefinitions),
            CreatedByUserId = tenant.UserId,
            Stages = stageDefinitions.OrderBy(x => x.Order).Select(x => new ContractWorkflowStage
            {
                Type = x.Type, Title = x.Title.Trim(), Order = x.Order,
                AssignedUserId = assignments.GetValueOrDefault(x.Type)
                    ?? x.DefaultAssignedUserId
            }).ToList()
        };
        db.Add(workflow);
        audit.Add("workflow.started", nameof(ContractWorkflow), workflow.Id.ToString(),
            new { workflow.ContractId, workflow.ContractGroupId,
                workflow.WorkflowDefinitionId, workflow.WorkflowDefinitionVersion });
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, Map(workflow));
    }

    public async Task<MutationResult<WorkflowRow>> Handle(
        DecideWorkflowCommand command, CancellationToken ct)
    {
        if (command.Request.Decision == WorkflowDecision.Pending)
            return new(MutationStatus.Invalid);
        var loaded = await LoadForAction(command.Id, ct);
        if (loaded.Result is not null) return loaded.Result;
        var workflow = loaded.Workflow!;
        var stage = Current(workflow);
        if (stage is null) return new(MutationStatus.Conflict);
        if (!loaded.Admin && stage.AssignedUserId != tenant.UserId)
            return new(MutationStatus.Forbidden, Message: "این مرحله به کاربر دیگری تخصیص یافته است.");
        var now = DateTime.UtcNow;
        stage.Decision = command.Request.Decision;
        stage.Comment = command.Request.Comment?.Trim();
        stage.DecidedByUserId = tenant.UserId;
        stage.DecidedAtUtc = now;
        workflow.UpdatedByUserId = tenant.UserId;
        workflow.UpdatedAtUtc = now;
        if (command.Request.Decision == WorkflowDecision.Approved
            && stage.Order < workflow.Stages.Max(x => x.Order))
            workflow.CurrentStageOrder = workflow.Stages.Where(x => x.Order > stage.Order)
                .Min(x => x.Order);
        else workflow.Status = command.Request.Decision;
        if (command.Request.Decision == WorkflowDecision.Approved
            && stage.Order == workflow.Stages.Max(x => x.Order))
        {
            workflow.Status = WorkflowDecision.Approved;
            workflow.Contract!.Status = ContractStatus.Approved;
            workflow.Contract.UpdatedAtUtc = now;
        }
        AddAction(workflow, stage, command.Request.Decision switch
        {
            WorkflowDecision.Approved => WorkflowActionType.Approved,
            WorkflowDecision.RevisionRequested => WorkflowActionType.RevisionRequested,
            _ => WorkflowActionType.Rejected
        }, command.Request.Comment);
        audit.Add("workflow.decision", nameof(ContractWorkflowStage), stage.Id.ToString(),
            new { command.Request.Decision, command.Request.Comment, Actor = tenant.UserId });
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, Map(workflow));
    }

    public async Task<MutationResult<WorkflowRow>> Handle(
        CommentWorkflowCommand command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.Request.Comment))
            return new(MutationStatus.Invalid);
        var loaded = await LoadForAction(command.Id, ct);
        if (loaded.Result is not null) return loaded.Result;
        var stage = Current(loaded.Workflow!);
        if (stage is null) return new(MutationStatus.Conflict);
        if (!loaded.Admin && stage.AssignedUserId != tenant.UserId)
            return new(MutationStatus.Forbidden);
        AddAction(loaded.Workflow!, stage, WorkflowActionType.Comment,
            command.Request.Comment);
        audit.Add("workflow.comment", nameof(ContractWorkflowStage), stage.Id.ToString());
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, Map(loaded.Workflow!));
    }

    public async Task<MutationResult<WorkflowRow>> Handle(
        DelegateWorkflowCommand command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.Request.AssignedUserId))
            return new(MutationStatus.Invalid);
        var loaded = await LoadForAction(command.Id, ct);
        if (loaded.Result is not null) return loaded.Result;
        var stage = Current(loaded.Workflow!);
        if (stage is null) return new(MutationStatus.Conflict);
        if (!loaded.Admin && stage.AssignedUserId != tenant.UserId)
            return new(MutationStatus.Forbidden);
        var previous = stage.AssignedUserId;
        stage.DelegatedFromUserId = previous;
        stage.AssignedUserId = command.Request.AssignedUserId.Trim();
        stage.DelegatedByUserId = tenant.UserId;
        stage.DelegatedAtUtc = DateTime.UtcNow;
        AddAction(loaded.Workflow!, stage, WorkflowActionType.Delegated,
            command.Request.Comment, previous, stage.AssignedUserId);
        audit.Add("workflow.delegated", nameof(ContractWorkflowStage), stage.Id.ToString(),
            new { From = previous, To = stage.AssignedUserId, Actor = tenant.UserId });
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, Map(loaded.Workflow!));
    }

    public Task<bool> Handle(DeleteWorkflowCommand command, CancellationToken ct) =>
        SetDeleted(command.Id, true, ct);
    public Task<bool> Handle(RestoreWorkflowCommand command, CancellationToken ct) =>
        SetDeleted(command.Id, false, ct);

    private async Task<bool> SetDeleted(Guid id, bool deleted, CancellationToken ct)
    {
        var workflow = await db.ContractWorkflows.IgnoreQueryFilters()
            .SingleOrDefaultAsync(x => x.Id == id
                && x.OrganizationId == tenant.OrganizationId, ct);
        if (workflow is null) return false;
        workflow.IsDeleted = deleted;
        workflow.DeletedAtUtc = deleted ? DateTime.UtcNow : null;
        workflow.DeletedByUserId = deleted ? tenant.UserId : null;
        audit.Add(deleted ? "workflow.deleted" : "workflow.restored",
            nameof(ContractWorkflow), id.ToString());
        await db.SaveChangesAsync(ct);
        return true;
    }

    private async Task<(ContractWorkflow? Workflow, bool Admin,
        MutationResult<WorkflowRow>? Result)> LoadForAction(Guid id, CancellationToken ct)
    {
        var workflow = await db.ContractWorkflows.Include(x => x.Contract)
            .ThenInclude(x => x!.GroupMemberships).Include(x => x.Stages)
            .Include(x => x.Actions).SingleOrDefaultAsync(x => x.Id == id
                && x.OrganizationId == tenant.OrganizationId, ct);
        if (workflow is null) return (null, false, new(MutationStatus.NotFound));
        if (workflow.Status != WorkflowDecision.Pending)
            return (null, false, new(MutationStatus.Conflict,
                Message: "گردش کار در وضعیت تصمیم‌پذیر نیست."));
        var allowed = await scope.AllowedGroups(ct);
        var admin = allowed is null;
        if (!admin && !workflow.Contract!.GroupMemberships.Any(x =>
                allowed!.Contains(x.ContractGroupId)))
            return (null, false, new(MutationStatus.Forbidden));
        return (workflow, admin, null);
    }

    private void AddAction(ContractWorkflow workflow, ContractWorkflowStage stage,
        WorkflowActionType type, string? comment, string? from = null, string? to = null)
    {
        var action = new ContractWorkflowAction
        {
            OrganizationId = tenant.OrganizationId, ContractWorkflowId = workflow.Id,
            ContractWorkflowStageId = stage.Id, Type = type, Comment = comment?.Trim(),
            FromUserId = from, ToUserId = to, PerformedByUserId = tenant.UserId
        };
        db.ContractWorkflowActions.Add(action);
        workflow.Actions.Add(action);
    }
    private static ContractWorkflowStage? Current(ContractWorkflow workflow) =>
        workflow.Stages.SingleOrDefault(x => x.Order == workflow.CurrentStageOrder
            && x.Decision == WorkflowDecision.Pending);
    private static IReadOnlyList<WorkflowStageDefinitionInput> DefaultDefinitions(
        StartWorkflowRequest x) =>
    [
        new(WorkflowStageType.Legal, "بررسی حقوقی", 1, x.LegalUserId),
        new(WorkflowStageType.Technical, "بررسی فنی", 2, x.TechnicalUserId),
        new(WorkflowStageType.Financial, "بررسی مالی", 3, x.FinancialUserId),
        new(WorkflowStageType.Expert, "بررسی کارشناسی", 4, x.ExpertUserId),
        new(WorkflowStageType.Managerial, "تأیید مدیریتی", 5, x.ManagerialUserId)
    ];
    internal static WorkflowRow Map(ContractWorkflow x) => new(
        x.Id, x.ContractId, x.Contract?.Subject ?? string.Empty, x.ContractGroupId,
        x.Status, x.CurrentStageOrder, x.CreatedAtUtc,
        x.Stages.OrderBy(s => s.Order).Select(s => new WorkflowStageRow(
            s.Id, s.Type, s.Title, s.Order, s.AssignedUserId, s.Decision, s.Comment,
            s.DecidedByUserId, s.DecidedAtUtc, s.DelegatedFromUserId)).ToArray(),
        x.Actions.OrderBy(a => a.PerformedAtUtc).Select(a => new WorkflowActionRow(
            a.Id, a.Type, a.Comment, a.FromUserId, a.ToUserId,
            a.PerformedByUserId, a.PerformedAtUtc)).ToArray());
}

public sealed class RiskUseCaseHandler(
    NegareshDbContext db, ICurrentTenant tenant, ContractOperationScope scope,
    IAuditWriter audit) :
    IRequestHandler<ListRiskChecklistDefinitionsQuery, PagedResponse<RiskChecklistDefinitionRow>>,
    IRequestHandler<SaveRiskChecklistDefinitionCommand, MutationResult<RiskChecklistDefinitionRow>>,
    IRequestHandler<DeleteRiskChecklistDefinitionCommand, bool>,
    IRequestHandler<RestoreRiskChecklistDefinitionCommand, bool>,
    IRequestHandler<ListRisksQuery, PagedResponse<RiskAssessmentRow>>,
    IRequestHandler<AssessRiskCommand, MutationResult<RiskAssessmentRow>>,
    IRequestHandler<DeleteRiskCommand, bool>, IRequestHandler<RestoreRiskCommand, bool>
{
    public async Task<PagedResponse<RiskChecklistDefinitionRow>> Handle(
        ListRiskChecklistDefinitionsQuery request, CancellationToken ct)
    {
        var allowed = await scope.AllowedGroups(ct);
        var query = db.ContractRiskChecklistDefinitions.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId
                && x.IsDeleted == request.Archived);
        if (allowed is not null) query = query.Where(x => x.ContractGroupId == null
            || allowed.Contains(x.ContractGroupId.Value));
        var page = await query.OrderBy(x => x.Name).ThenByDescending(x => x.Version)
            .ToPagedResponseAsync(new PageRequest(request.PageNumber, request.PageSize), ct);
        return WorkflowDefinitionHandler.ConvertPage(page, MapDefinition);
    }

    public async Task<MutationResult<RiskChecklistDefinitionRow>> Handle(
        SaveRiskChecklistDefinitionCommand command, CancellationToken ct)
    {
        var r = command.Request;
        if (string.IsNullOrWhiteSpace(r.Name) || r.Items.Count == 0
            || r.Items.Any(x => string.IsNullOrWhiteSpace(x.Code)
                || string.IsNullOrWhiteSpace(x.Title) || x.Weight <= 0)
            || r.Items.Select(x => x.Code.Trim()).Distinct(
                StringComparer.OrdinalIgnoreCase).Count() != r.Items.Count)
            return new(MutationStatus.Invalid, Message: "تعریف چک‌لیست نامعتبر است.");
        var allowed = await scope.AllowedGroups(ct);
        if (r.ContractGroupId is not null && allowed is not null
            && !allowed.Contains(r.ContractGroupId.Value)) return new(MutationStatus.Forbidden);
        var current = command.Id is null ? null
            : await db.ContractRiskChecklistDefinitions.SingleOrDefaultAsync(x =>
                x.Id == command.Id && x.OrganizationId == tenant.OrganizationId, ct);
        if (command.Id is not null && current is null) return new(MutationStatus.NotFound);
        var key = current?.DefinitionKey ?? Guid.NewGuid();
        var version = current is null ? 1 : await db.ContractRiskChecklistDefinitions
            .IgnoreQueryFilters().Where(x => x.OrganizationId == tenant.OrganizationId
                && x.DefinitionKey == key).MaxAsync(x => x.Version, ct) + 1;
        if (current is not null) current.IsActive = false;
        var entity = new ContractRiskChecklistDefinition
        {
            OrganizationId = tenant.OrganizationId, DefinitionKey = key,
            ContractGroupId = r.ContractGroupId, Name = r.Name.Trim(), Version = version,
            ItemsJson = JsonSerializer.Serialize(r.Items), IsActive = r.IsActive,
            CreatedByUserId = tenant.UserId
        };
        db.Add(entity);
        audit.Add("risk-checklist.version-created", nameof(ContractRiskChecklistDefinition),
            entity.Id.ToString(), new { entity.DefinitionKey, entity.Version });
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, MapDefinition(entity));
    }

    public Task<bool> Handle(DeleteRiskChecklistDefinitionCommand c, CancellationToken ct) =>
        SetDefinitionDeleted(c.Id, true, ct);
    public Task<bool> Handle(RestoreRiskChecklistDefinitionCommand c, CancellationToken ct) =>
        SetDefinitionDeleted(c.Id, false, ct);
    private async Task<bool> SetDefinitionDeleted(Guid id, bool deleted, CancellationToken ct)
    {
        var x = await db.ContractRiskChecklistDefinitions.IgnoreQueryFilters()
            .SingleOrDefaultAsync(x => x.Id == id
                && x.OrganizationId == tenant.OrganizationId, ct);
        if (x is null) return false;
        x.IsDeleted = deleted; x.IsActive = !deleted;
        x.DeletedAtUtc = deleted ? DateTime.UtcNow : null;
        x.DeletedByUserId = deleted ? tenant.UserId : null;
        audit.Add(deleted ? "risk-checklist.deleted" : "risk-checklist.restored",
            nameof(ContractRiskChecklistDefinition), id.ToString());
        await db.SaveChangesAsync(ct); return true;
    }

    public async Task<PagedResponse<RiskAssessmentRow>> Handle(
        ListRisksQuery request, CancellationToken ct)
    {
        var ids = await scope.AllowedContractIds(ct);
        var query = db.ContractRiskAssessments.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId
                && x.IsDeleted == request.Archived);
        if (ids is not null) query = query.Where(x => ids.Contains(x.ContractId));
        if (request.ContractId is not null) query = query.Where(x =>
            x.ContractId == request.ContractId);
        var page = await query.Include(x => x.Contract)
            .OrderByDescending(x => x.CreatedAtUtc).ToPagedResponseAsync(
                new PageRequest(request.PageNumber, request.PageSize), ct);
        return WorkflowDefinitionHandler.ConvertPage(page, MapRisk);
    }

    public async Task<MutationResult<RiskAssessmentRow>> Handle(
        AssessRiskCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var contract = await scope.Contract(r.ContractId, ct);
        if (contract is null) return new(MutationStatus.NotFound);
        ContractRiskChecklistDefinition? definition = null;
        IReadOnlyList<RiskChecklistDefinitionItem> definitionItems = [];
        if (r.ChecklistDefinitionId is not null)
        {
            definition = await db.ContractRiskChecklistDefinitions.AsNoTracking()
                .SingleOrDefaultAsync(x => x.Id == r.ChecklistDefinitionId
                    && x.OrganizationId == tenant.OrganizationId && x.IsActive, ct);
            if (definition is null || definition.ContractGroupId is not null
                && !contract.GroupMemberships.Any(x =>
                    x.ContractGroupId == definition.ContractGroupId))
                return new(MutationStatus.Invalid, Message: "چک‌لیست با گروه قرارداد سازگار نیست.");
            definitionItems = WorkflowDefinitionHandler.Parse<RiskChecklistDefinitionItem>(
                definition.ItemsJson);
        }
        if (r.Items.Count == 0 || r.Items.Any(x => x.Weight <= 0 || x.Score is < 0 or > 100))
            return new(MutationStatus.Invalid);
        if (definition is not null && definitionItems.Any(d => !r.Items.Any(x =>
                x.Code.Equals(d.Code, StringComparison.OrdinalIgnoreCase))))
            return new(MutationStatus.Invalid, Message: "تمام موارد چک‌لیست باید ارزیابی شوند.");
        var denominator = r.Items.Sum(x => x.Weight);
        var score = denominator == 0 ? 0 : (int)Math.Round(
            r.Items.Sum(x => x.Weight * x.Score) / (decimal)denominator);
        var critical = r.Items.Any(x => x.IsCritical && x.Score >= 80)
            || definitionItems.Any(d => d.IsCritical && r.Items.Any(x =>
                x.Code.Equals(d.Code, StringComparison.OrdinalIgnoreCase) && x.Score >= 80));
        var version = await db.ContractRiskAssessments.IgnoreQueryFilters()
            .Where(x => x.OrganizationId == tenant.OrganizationId && x.ContractId == r.ContractId)
            .Select(x => (int?)x.Version).MaxAsync(ct) + 1 ?? 1;
        var entity = new ContractRiskAssessment
        {
            OrganizationId = tenant.OrganizationId, ContractId = r.ContractId,
            ChecklistDefinitionId = definition?.Id,
            ChecklistDefinitionVersion = definition?.Version, Version = version,
            Score = score, Level = critical ? RiskLevel.Critical : score switch
            { >= 80 => RiskLevel.Critical, >= 60 => RiskLevel.High,
                >= 30 => RiskLevel.Medium, _ => RiskLevel.Low },
            ChecklistJson = JsonSerializer.Serialize(r.Items),
            DefinitionSnapshotJson = definition?.ItemsJson ?? "[]",
            Summary = r.Summary?.Trim(), CreatedByUserId = tenant.UserId,
            Contract = contract
        };
        db.Add(entity);
        audit.Add("risk.assessed", nameof(ContractRiskAssessment), entity.Id.ToString(),
            new { entity.ContractId, entity.Version, entity.Score, entity.Level });
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, MapRisk(entity));
    }

    public Task<bool> Handle(DeleteRiskCommand c, CancellationToken ct) =>
        SetRiskDeleted(c.Id, true, ct);
    public Task<bool> Handle(RestoreRiskCommand c, CancellationToken ct) =>
        SetRiskDeleted(c.Id, false, ct);
    private async Task<bool> SetRiskDeleted(Guid id, bool deleted, CancellationToken ct)
    {
        var x = await db.ContractRiskAssessments.IgnoreQueryFilters()
            .SingleOrDefaultAsync(x => x.Id == id
                && x.OrganizationId == tenant.OrganizationId, ct);
        if (x is null) return false;
        x.IsDeleted = deleted; x.DeletedAtUtc = deleted ? DateTime.UtcNow : null;
        x.DeletedByUserId = deleted ? tenant.UserId : null;
        audit.Add(deleted ? "risk.deleted" : "risk.restored",
            nameof(ContractRiskAssessment), id.ToString());
        await db.SaveChangesAsync(ct); return true;
    }

    private static RiskChecklistDefinitionRow MapDefinition(
        ContractRiskChecklistDefinition x) => new(x.Id, x.DefinitionKey, x.Name,
        x.ContractGroupId, x.Version, x.IsActive,
        WorkflowDefinitionHandler.Parse<RiskChecklistDefinitionItem>(x.ItemsJson),
        x.CreatedAtUtc);
    private static RiskAssessmentRow MapRisk(ContractRiskAssessment x) => new(
        x.Id, x.ContractId, x.Contract?.Subject ?? string.Empty,
        x.ChecklistDefinitionId, x.ChecklistDefinitionVersion, x.Version,
        x.Score, x.Level, x.Summary,
        WorkflowDefinitionHandler.Parse<RiskChecklistItem>(x.ChecklistJson),
        x.CreatedByUserId, x.CreatedAtUtc);
}

public sealed class OperationUseCaseHandler(
    NegareshDbContext db, ICurrentTenant tenant, ContractOperationScope scope,
    IAuditWriter audit, IContractOperationReminderProcessor reminders) :
    IRequestHandler<ListOperationsQuery, PagedResponse<OperationRow>>,
    IRequestHandler<CreateOperationCommand, MutationResult<OperationRow>>,
    IRequestHandler<ChangeOperationStatusCommand, bool>,
    IRequestHandler<UpdateOperationCommand, MutationResult<OperationRow>>,
    IRequestHandler<DeleteOperationCommand, bool>, IRequestHandler<RestoreOperationCommand, bool>,
    IRequestHandler<RunOperationRemindersCommand, ReminderRunResult>,
    IRequestHandler<GetManagementDashboardQuery, ManagementDashboardResult>,
    IRequestHandler<GenerateContractOperationsReportQuery, ContractOperationsReport>
{
    public async Task<PagedResponse<OperationRow>> Handle(
        ListOperationsQuery request, CancellationToken ct)
    {
        var ids = await scope.AllowedContractIds(ct);
        var query = db.ContractOperations.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId
                && x.IsDeleted == request.Archived);
        if (ids is not null) query = query.Where(x => ids.Contains(x.ContractId));
        if (request.ContractId is not null) query = query.Where(x =>
            x.ContractId == request.ContractId);
        if (request.MineOnly) query = query.Where(x => x.AssignedUserId == tenant.UserId);
        var page = await query.Include(x => x.Contract).OrderBy(x => x.DueDate)
            .ThenBy(x => x.Title).ToPagedResponseAsync(
                new PageRequest(request.PageNumber, request.PageSize), ct);
        return WorkflowDefinitionHandler.ConvertPage(page, Map);
    }

    public async Task<MutationResult<OperationRow>> Handle(
        CreateOperationCommand command, CancellationToken ct)
    {
        var contract = await scope.Contract(command.Request.ContractId, ct);
        if (contract is null) return new(MutationStatus.NotFound);
        if (!Valid(command.Request)) return new(MutationStatus.Invalid);
        var entity = new ContractOperation
        {
            OrganizationId = tenant.OrganizationId, ContractId = contract.Id,
            CreatedByUserId = tenant.UserId, Title = string.Empty, Contract = contract
        };
        Apply(entity, command.Request);
        db.Add(entity);
        audit.Add("operation.created", nameof(ContractOperation), entity.Id.ToString(),
            new { entity.ContractId, entity.Type, entity.DueDate, entity.AssignedUserId });
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, Map(entity));
    }

    public async Task<bool> Handle(ChangeOperationStatusCommand command, CancellationToken ct)
    {
        var entity = await AccessibleOperation(command.Id, false, ct);
        if (entity is null || command.Request.Status == ContractOperationStatus.Overdue)
            return false;
        entity.Status = command.Request.Status;
        if (entity.Status == ContractOperationStatus.Completed)
        {
            entity.CompletedAtUtc = DateTime.UtcNow;
            entity.CompletedByUserId = tenant.UserId;
        }
        else { entity.CompletedAtUtc = null; entity.CompletedByUserId = null; }
        Touch(entity);
        audit.Add("operation.status-changed", nameof(ContractOperation), entity.Id.ToString(),
            new { entity.Status, Actor = tenant.UserId });
        await db.SaveChangesAsync(ct); return true;
    }

    public async Task<MutationResult<OperationRow>> Handle(
        UpdateOperationCommand command, CancellationToken ct)
    {
        var entity = await AccessibleOperation(command.Id, false, ct);
        if (entity is null) return new(MutationStatus.NotFound);
        if (!Valid(command.Request) || await scope.Contract(command.Request.ContractId, ct) is null)
            return new(MutationStatus.Invalid);
        Apply(entity, command.Request); Touch(entity);
        audit.Add("operation.updated", nameof(ContractOperation), entity.Id.ToString());
        await db.SaveChangesAsync(ct);
        return new(MutationStatus.Success, Map(entity));
    }

    public Task<bool> Handle(DeleteOperationCommand c, CancellationToken ct) =>
        SetDeleted(c.Id, true, ct);
    public Task<bool> Handle(RestoreOperationCommand c, CancellationToken ct) =>
        SetDeleted(c.Id, false, ct);
    private async Task<bool> SetDeleted(Guid id, bool deleted, CancellationToken ct)
    {
        var entity = await AccessibleOperation(id, true, ct);
        if (entity is null) return false;
        entity.IsDeleted = deleted; entity.DeletedAtUtc = deleted ? DateTime.UtcNow : null;
        entity.DeletedByUserId = deleted ? tenant.UserId : null;
        audit.Add(deleted ? "operation.deleted" : "operation.restored",
            nameof(ContractOperation), id.ToString());
        await db.SaveChangesAsync(ct); return true;
    }

    public Task<ReminderRunResult> Handle(RunOperationRemindersCommand command,
        CancellationToken ct) => reminders.ProcessOrganizationAsync(
            tenant.OrganizationId, command.AsOf ?? DateOnly.FromDateTime(DateTime.UtcNow), ct);

    public async Task<ManagementDashboardResult> Handle(
        GetManagementDashboardQuery request, CancellationToken ct)
    {
        var ids = await scope.AllowedContractIds(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var until = today.AddDays(30);
        var contracts = db.Contracts.Where(x => x.OrganizationId == tenant.OrganizationId);
        var workflows = db.ContractWorkflows.Where(x => x.OrganizationId == tenant.OrganizationId);
        var operations = db.ContractOperations.Where(x => x.OrganizationId == tenant.OrganizationId);
        var risks = db.ContractRiskAssessments.Where(x => x.OrganizationId == tenant.OrganizationId);
        if (ids is not null)
        {
            contracts = contracts.Where(x => ids.Contains(x.Id));
            workflows = workflows.Where(x => ids.Contains(x.ContractId));
            operations = operations.Where(x => ids.Contains(x.ContractId));
            risks = risks.Where(x => ids.Contains(x.ContractId));
        }
        return new(
            await contracts.CountAsync(x => x.Status == ContractStatus.Active, ct),
            await workflows.CountAsync(x => x.Status == WorkflowDecision.Pending, ct),
            await workflows.CountAsync(x => x.Status == WorkflowDecision.Pending
                && x.Stages.Any(s => s.Order == x.CurrentStageOrder
                    && s.AssignedUserId == tenant.UserId), ct),
            await operations.CountAsync(x => x.Status == ContractOperationStatus.Overdue
                || x.Status == ContractOperationStatus.Pending && x.DueDate < today, ct),
            await operations.CountAsync(x => x.Status == ContractOperationStatus.Pending
                && x.DueDate >= today && x.DueDate <= until, ct),
            await risks.CountAsync(x => x.Level == RiskLevel.High
                || x.Level == RiskLevel.Critical, ct),
            await operations.AsNoTracking().Where(x =>
                    x.Status == ContractOperationStatus.Pending
                    && x.DueDate >= today && x.DueDate <= until)
                .OrderBy(x => x.DueDate).Take(20)
                .Select(x => new UpcomingOperationRow(x.Id, x.Title, x.Type,
                    x.DueDate, x.ContractId, x.Contract!.Subject, x.AssignedUserId))
                .ToListAsync(ct));
    }

    public async Task<ContractOperationsReport> Handle(
        GenerateContractOperationsReportQuery request, CancellationToken ct)
    {
        var ids = await scope.AllowedContractIds(ct);
        var query = db.ContractOperations.AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId);
        if (ids is not null) query = query.Where(x => ids.Contains(x.ContractId));
        if (request.From is not null) query = query.Where(x => x.DueDate >= request.From);
        if (request.To is not null) query = query.Where(x => x.DueDate <= request.To);
        var rows = await query.OrderBy(x => x.DueDate).Select(x => new
        { x.Contract!.Subject, x.Title, x.Type, x.DueDate, x.Amount,
            x.Currency, x.Status, x.AssignedUserId }).ToListAsync(ct);
        var csv = new StringBuilder("قرارداد,عنوان,نوع,سررسید,مبلغ,ارز,وضعیت,مسئول\r\n");
        foreach (var x in rows) csv.AppendLine(string.Join(',',
            Cell(x.Subject), Cell(x.Title), x.Type, x.DueDate,
            x.Amount?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "",
            Cell(x.Currency), x.Status, Cell(x.AssignedUserId)));
        var content = Encoding.UTF8.GetPreamble().Concat(
            Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
        audit.Add("operations.report-downloaded", nameof(ContractOperation), null,
            new { request.From, request.To, Count = rows.Count });
        await db.SaveChangesAsync(ct);
        return new(content, "text/csv; charset=utf-8",
            $"contract-operations-{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
    }

    private async Task<ContractOperation?> AccessibleOperation(Guid id,
        bool ignoreFilters, CancellationToken ct)
    {
        var query = ignoreFilters ? db.ContractOperations.IgnoreQueryFilters()
            : db.ContractOperations;
        var entity = await query.SingleOrDefaultAsync(x => x.Id == id
            && x.OrganizationId == tenant.OrganizationId, ct);
        return entity is not null && await scope.Contract(entity.ContractId, ct) is not null
            ? entity : null;
    }
    private static bool Valid(SaveOperationRequest x) =>
        !string.IsNullOrWhiteSpace(x.Title) && !string.IsNullOrWhiteSpace(x.Currency)
        && x.ReminderDaysBefore is >= 0 and <= 365 && x.Amount is null or >= 0;
    private static void Apply(ContractOperation x, SaveOperationRequest r)
    {
        x.ContractId = r.ContractId; x.Type = r.Type; x.Title = r.Title.Trim();
        x.DueDate = r.DueDate; x.Amount = r.Amount;
        x.Currency = r.Currency.Trim().ToUpperInvariant();
        x.ReminderDaysBefore = r.ReminderDaysBefore;
        x.Description = r.Description?.Trim();
        x.AssignedUserId = r.AssignedUserId?.Trim();
    }
    private void Touch(ContractOperation x)
    { x.UpdatedByUserId = tenant.UserId; x.UpdatedAtUtc = DateTime.UtcNow; }
    private static OperationRow Map(ContractOperation x) => new(x.Id, x.ContractId,
        x.Contract?.Subject ?? string.Empty, x.Type, x.Title, x.DueDate, x.Amount,
        x.Currency, x.Status, x.ReminderDaysBefore, x.Description, x.AssignedUserId,
        x.CompletedByUserId, x.CompletedAtUtc);
    private static string Cell(string? value) => $"\"{(value ?? string.Empty).Replace("\"", "\"\"")}\"";
}
