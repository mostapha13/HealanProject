using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.ContractOperations;
using NegareshAI.Api.Data;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class M6WorkflowRiskOperationsTests
{
    [Fact]
    public async Task Workflow_definition_update_creates_an_immutable_new_version()
    {
        await using var db = CreateDb();
        var seed = await Seed(db);
        var tenant = new Tenant(seed.OrganizationId, "admin");
        var handler = Definitions(db, tenant, null);
        var request = new SaveWorkflowDefinitionRequest("گردش استاندارد", seed.GroupId,
        [
            new(WorkflowStageType.Legal, "حقوقی", 1, "legal"),
            new(WorkflowStageType.Managerial, "مدیر", 2, "manager")
        ]);

        var first = await handler.Handle(new SaveWorkflowDefinitionCommand(null, request), default);
        var second = await handler.Handle(new SaveWorkflowDefinitionCommand(first.Value!.Id,
            request with { Name = "گردش استاندارد اصلاحی" }), default);

        Assert.Equal(1, first.Value.Version);
        Assert.Equal(2, second.Value!.Version);
        Assert.Equal(first.Value.DefinitionKey, second.Value.DefinitionKey);
        Assert.False((await db.ContractWorkflowDefinitions.SingleAsync(
            x => x.Id == first.Value.Id)).IsActive);
        Assert.Contains(db.AuditLogs, x => x.Action == "workflow-definition.version-created");
    }

    [Fact]
    public async Task Only_assignee_can_decide_and_delegation_transfers_the_task()
    {
        await using var db = CreateDb();
        var seed = await Seed(db);
        var admin = new Tenant(seed.OrganizationId, "admin");
        var started = await Workflows(db, admin, null).Handle(new StartWorkflowCommand(
            new(seed.ContractId, "legal-a", "technical", "financial", "manager",
                ExpertUserId: "expert")), default);
        var allowed = new AllowedScope(seed.GroupId);

        var stranger = await Workflows(db, new Tenant(seed.OrganizationId, "legal-b"), allowed)
            .Handle(new DecideWorkflowCommand(started.Value!.Id,
                new(WorkflowDecision.Approved, "بدون تخصیص")), default);
        Assert.Equal(MutationStatus.Forbidden, stranger.Status);

        var delegated = await Workflows(db, new Tenant(seed.OrganizationId, "legal-a"), allowed)
            .Handle(new DelegateWorkflowCommand(started.Value.Id,
                new("legal-b", "واگذاری به جانشین")), default);
        Assert.Equal("legal-b", delegated.Value!.Stages.Single(x => x.Order == 1).AssignedUserId);

        var oldAssignee = await Workflows(db, new Tenant(seed.OrganizationId, "legal-a"), allowed)
            .Handle(new DecideWorkflowCommand(started.Value.Id,
                new(WorkflowDecision.Approved, "نباید مجاز باشد")), default);
        Assert.Equal(MutationStatus.Forbidden, oldAssignee.Status);

        var approved = await Workflows(db, new Tenant(seed.OrganizationId, "legal-b"), allowed)
            .Handle(new DecideWorkflowCommand(started.Value.Id,
                new(WorkflowDecision.Approved, "تأیید جانشین")), default);
        Assert.Equal(2, approved.Value!.CurrentStageOrder);
        Assert.Contains(approved.Value.Actions, x => x.Type == WorkflowActionType.Delegated);
        Assert.Contains(approved.Value.Actions, x => x.Type == WorkflowActionType.Approved
            && x.PerformedByUserId == "legal-b");
    }

    [Fact]
    public async Task Personal_worklist_contains_only_the_current_users_authorized_stage()
    {
        await using var db = CreateDb();
        var seed = await Seed(db);
        var admin = new Tenant(seed.OrganizationId, "admin");
        await Workflows(db, admin, null).Handle(new StartWorkflowCommand(
            new(seed.ContractId, "legal-a", "technical", "financial", "manager",
                ExpertUserId: "expert")), default);

        var mine = await Workflows(db, new Tenant(seed.OrganizationId, "legal-a"),
            new AllowedScope(seed.GroupId)).Handle(new ListWorkflowsQuery(
                MyWorklistOnly: true), default);
        var others = await Workflows(db, new Tenant(seed.OrganizationId, "technical"),
            new AllowedScope(seed.GroupId)).Handle(new ListWorkflowsQuery(
                MyWorklistOnly: true), default);

        Assert.Single(mine.Items);
        Assert.Empty(others.Items);
    }

    [Fact]
    public async Task Risk_score_is_weighted_versioned_and_critical_item_overrides_level()
    {
        await using var db = CreateDb();
        var seed = await Seed(db);
        var tenant = new Tenant(seed.OrganizationId, "risk-user");
        var handler = Risks(db, tenant, null);
        var definition = await handler.Handle(new SaveRiskChecklistDefinitionCommand(null,
            new("ریسک تخصصی", seed.GroupId,
            [
                new("LEGAL", "ریسک حقوقی", 1, true),
                new("FIN", "ریسک مالی", 3)
            ])), default);
        var request = new RiskAssessmentRequest(seed.ContractId,
        [
            new("LEGAL", "ریسک حقوقی", 1, 80, null, true),
            new("FIN", "ریسک مالی", 3, 20, null)
        ], "ارزیابی اول", definition.Value!.Id);

        var first = await handler.Handle(new AssessRiskCommand(request), default);
        var second = await handler.Handle(new AssessRiskCommand(
            request with { Summary = "ارزیابی دوم" }), default);

        Assert.Equal(35, first.Value!.Score);
        Assert.Equal(RiskLevel.Critical, first.Value.Level);
        Assert.Equal(1, first.Value.Version);
        Assert.Equal(2, second.Value!.Version);
        Assert.Equal(definition.Value.Version, first.Value.ChecklistDefinitionVersion);
    }

    [Fact]
    public async Task Reminder_processing_is_idempotent_and_marks_overdue_from_sql_state()
    {
        await using var db = CreateDb();
        var seed = await Seed(db);
        var today = new DateOnly(2026, 8, 5);
        db.ContractOperations.AddRange(
            Operation(seed, "عقب‌افتاده", today.AddDays(-2), 1),
            Operation(seed, "پیش‌رو", today.AddDays(5), 7));
        await db.SaveChangesAsync();
        var processor = new ContractOperationReminderProcessor(db);

        var first = await processor.ProcessOrganizationAsync(
            seed.OrganizationId, today, default);
        var second = await processor.ProcessOrganizationAsync(
            seed.OrganizationId, today, default);

        Assert.Equal(1, first.MarkedOverdue);
        Assert.Equal(1, first.UpcomingQueued);
        Assert.Equal(1, first.OverdueQueued);
        Assert.Equal(2, second.ExistingSkipped);
        Assert.Equal(2, await db.ContractOperationReminders.CountAsync());
        Assert.Equal(ContractOperationStatus.Overdue,
            (await db.ContractOperations.SingleAsync(x => x.Title == "عقب‌افتاده")).Status);
    }

    [Fact]
    public async Task Operations_support_soft_delete_restore_completion_and_csv_report()
    {
        await using var db = CreateDb();
        var seed = await Seed(db);
        var tenant = new Tenant(seed.OrganizationId, "operator");
        var handler = Operations(db, tenant, null);
        var created = await handler.Handle(new CreateOperationCommand(new(
            seed.ContractId, ContractOperationType.Obligation, "تحویل تعهد",
            new DateOnly(2026, 8, 20), 1000, "irr", 5, "شرح", "operator")), default);
        Assert.True(await handler.Handle(new ChangeOperationStatusCommand(
            created.Value!.Id, new(ContractOperationStatus.Completed)), default));
        Assert.True(await handler.Handle(new DeleteOperationCommand(created.Value.Id), default));
        Assert.Empty((await handler.Handle(new ListOperationsQuery(null), default)).Items);
        Assert.Single((await handler.Handle(new ListOperationsQuery(
            null, Archived: true), default)).Items);
        Assert.True(await handler.Handle(new RestoreOperationCommand(created.Value.Id), default));

        var report = await handler.Handle(new GenerateContractOperationsReportQuery(null, null), default);
        Assert.StartsWith("text/csv", report.ContentType);
        Assert.Equal([0xEF, 0xBB, 0xBF], report.Content[..3]);
        var saved = await db.ContractOperations.SingleAsync(x => x.Id == created.Value.Id);
        Assert.Equal("operator", saved.CompletedByUserId);
        Assert.NotNull(saved.CompletedAtUtc);
    }

    private static WorkflowDefinitionHandler Definitions(NegareshDbContext db,
        ICurrentTenant tenant, IDataScopeAuthorizer? authorizer) => new(db, tenant,
        new ContractOperationScope(db, tenant, authorizer), new AuditWriter(db, tenant));
    private static WorkflowUseCaseHandler Workflows(NegareshDbContext db,
        ICurrentTenant tenant, IDataScopeAuthorizer? authorizer) => new(db, tenant,
        new ContractOperationScope(db, tenant, authorizer), new AuditWriter(db, tenant));
    private static RiskUseCaseHandler Risks(NegareshDbContext db,
        ICurrentTenant tenant, IDataScopeAuthorizer? authorizer) => new(db, tenant,
        new ContractOperationScope(db, tenant, authorizer), new AuditWriter(db, tenant));
    private static OperationUseCaseHandler Operations(NegareshDbContext db,
        ICurrentTenant tenant, IDataScopeAuthorizer? authorizer) => new(db, tenant,
        new ContractOperationScope(db, tenant, authorizer), new AuditWriter(db, tenant),
        new ContractOperationReminderProcessor(db));

    private static ContractOperation Operation(Scenario seed, string title,
        DateOnly dueDate, int reminderDays) => new()
    {
        OrganizationId = seed.OrganizationId, ContractId = seed.ContractId,
        Title = title, Type = ContractOperationType.Deadline, DueDate = dueDate,
        ReminderDaysBefore = reminderDays, CreatedByUserId = "operator"
    };

    private static async Task<Scenario> Seed(NegareshDbContext db)
    {
        var organization = new Organization { Name = "سازمان" };
        var document = new Document { OrganizationId = organization.Id,
            Title = "سند قرارداد", DocumentType = "contract" };
        var group = new ContractGroup { OrganizationId = organization.Id,
            Name = "پشتیبانی", CreatedByUserId = "admin" };
        var contract = new Contract { OrganizationId = organization.Id,
            DocumentId = document.Id, Document = document, Subject = "قرارداد فسا",
            Status = ContractStatus.Active, PrimaryContractGroupId = group.Id };
        var membership = new ContractGroupMembership { ContractId = contract.Id,
            ContractGroupId = group.Id, Contract = contract, ContractGroup = group,
            IsPrimary = true };
        contract.GroupMemberships.Add(membership);
        db.AddRange(organization, document, group, contract);
        await db.SaveChangesAsync();
        return new(organization.Id, group.Id, contract.Id);
    }

    private static NegareshDbContext CreateDb() => new(
        new DbContextOptionsBuilder<NegareshDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private sealed record Tenant(Guid OrganizationId, string UserId) : ICurrentTenant;
    private sealed record Scenario(Guid OrganizationId, Guid GroupId, Guid ContractId);
    private sealed class AllowedScope(params Guid[] ids) : IDataScopeAuthorizer
    {
        private readonly IReadOnlySet<Guid> allowed = ids.ToHashSet();
        public Task<bool> CanAccessAsync(DataScopeResourceType resourceType, Guid resourceId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(allowed.Contains(resourceId));
        public Task<IReadOnlySet<Guid>?> GetAllowedResourceIdsAsync(
            DataScopeResourceType resourceType,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlySet<Guid>?>(allowed);
    }
}
