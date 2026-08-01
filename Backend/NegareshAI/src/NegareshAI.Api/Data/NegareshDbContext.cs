using Microsoft.EntityFrameworkCore;

namespace NegareshAI.Api.Data;

public sealed class NegareshDbContext(DbContextOptions<NegareshDbContext> options) : DbContext(options)
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<OrganizationMembership> OrganizationMemberships => Set<OrganizationMembership>();
    public DbSet<DataScopeAssignment> DataScopeAssignments => Set<DataScopeAssignment>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<DocumentAttachment> DocumentAttachments => Set<DocumentAttachment>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<ContractGroup> ContractGroups => Set<ContractGroup>();
    public DbSet<ContractGroupMembership> ContractGroupMemberships => Set<ContractGroupMembership>();
    public DbSet<ContractParty> ContractParties => Set<ContractParty>();
    public DbSet<ContractStatusDefinition> ContractStatusDefinitions => Set<ContractStatusDefinition>();
    public DbSet<ContractBaseDocumentProfile> ContractBaseDocumentProfiles => Set<ContractBaseDocumentProfile>();
    public DbSet<OrganizationParty> OrganizationParties => Set<OrganizationParty>();
    public DbSet<ContractClause> ContractClauses => Set<ContractClause>();
    public DbSet<ContractValue> ContractValues => Set<ContractValue>();
    public DbSet<ContractDate> ContractDates => Set<ContractDate>();
    public DbSet<ContractObligation> ContractObligations => Set<ContractObligation>();
    public DbSet<ContractTemplate> ContractTemplates => Set<ContractTemplate>();
    public DbSet<ContractYearDefinition> ContractYears => Set<ContractYearDefinition>();
    public DbSet<ContractGenerationRun> ContractGenerationRuns => Set<ContractGenerationRun>();
    public DbSet<Checklist> Checklists => Set<Checklist>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RuntimeSetting> RuntimeSettings => Set<RuntimeSetting>();
    public DbSet<DocumentGroup> DocumentGroups => Set<DocumentGroup>();
    public DbSet<DocumentGroupMember> DocumentGroupMembers => Set<DocumentGroupMember>();
    public DbSet<ComplianceCriterion> ComplianceCriteria => Set<ComplianceCriterion>();
    public DbSet<DocumentGroupCriterion> DocumentGroupCriteria => Set<DocumentGroupCriterion>();
    public DbSet<GoldenDocument> GoldenDocuments => Set<GoldenDocument>();
    public DbSet<RuleSet> RuleSets => Set<RuleSet>();
    public DbSet<Rule> Rules => Set<Rule>();
    public DbSet<RuleParameter> RuleParameters => Set<RuleParameter>();
    public DbSet<ComparisonRun> ComparisonRuns => Set<ComparisonRun>();
    public DbSet<ComparisonRunRuleSet> ComparisonRunRuleSets => Set<ComparisonRunRuleSet>();
    public DbSet<ComparisonFinding> ComparisonFindings => Set<ComparisonFinding>();
    public DbSet<ContractWorkflow> ContractWorkflows => Set<ContractWorkflow>();
    public DbSet<ContractWorkflowStage> ContractWorkflowStages => Set<ContractWorkflowStage>();
    public DbSet<ContractRiskAssessment> ContractRiskAssessments => Set<ContractRiskAssessment>();
    public DbSet<ContractOperation> ContractOperations => Set<ContractOperation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrganizationMembership>()
            .HasIndex(item => new { item.OrganizationId, item.UserId })
            .IsUnique();
        modelBuilder.Entity<DataScopeAssignment>()
            .HasIndex(x => new { x.OrganizationId, x.ResourceType, x.ResourceId, x.SubjectType, x.SubjectId })
            .IsUnique();
        modelBuilder.Entity<DataScopeAssignment>()
            .HasIndex(x => new { x.OrganizationId, x.SubjectType, x.SubjectId, x.ResourceType });
        modelBuilder.Entity<DataScopeAssignment>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Document>()
            .HasIndex(item => new { item.OrganizationId, item.IsDeleted, item.CreatedAtUtc });
        modelBuilder.Entity<Document>()
            .HasQueryFilter(item => !item.IsDeleted);
        modelBuilder.Entity<DocumentVersion>()
            .HasIndex(item => new { item.DocumentId, item.VersionNumber })
            .IsUnique();
        modelBuilder.Entity<Contract>()
            .HasIndex(item => new { item.OrganizationId, item.ContractNumber })
            .IsUnique()
            .HasFilter("[ContractNumber] IS NOT NULL");
        modelBuilder.Entity<Contract>()
            .HasQueryFilter(item => !item.Document!.IsDeleted);
        modelBuilder.Entity<Contract>()
            .Property(item => item.Amount)
            .HasPrecision(18, 2);
        modelBuilder.Entity<ContractStatusDefinition>()
            .HasIndex(item => new { item.OrganizationId, item.Name }).IsUnique();
        modelBuilder.Entity<ContractBaseDocumentProfile>()
            .HasIndex(item => new { item.OrganizationId, item.Name }).IsUnique();
        modelBuilder.Entity<OrganizationParty>()
            .HasIndex(item => new { item.OrganizationId, item.Name }).IsUnique();
        modelBuilder.Entity<Contract>()
            .HasOne(item => item.StatusDefinition).WithMany()
            .HasForeignKey(item => item.StatusDefinitionId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Contract>()
            .HasOne(item => item.BaseDocumentProfile).WithMany()
            .HasForeignKey(item => item.BaseDocumentProfileId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Contract>()
            .HasOne(item => item.PrimaryContractGroup).WithMany()
            .HasForeignKey(item => item.PrimaryContractGroupId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ContractGroup>()
            .HasIndex(item => new { item.OrganizationId, item.Name }).IsUnique();
        modelBuilder.Entity<ContractGroup>().HasQueryFilter(item => !item.IsDeleted);
        modelBuilder.Entity<ContractGroupMembership>()
            .HasIndex(item => new { item.ContractId, item.ContractGroupId }).IsUnique();
        modelBuilder.Entity<ContractGroupMembership>()
            .HasOne(item => item.Contract).WithMany(item => item.GroupMemberships)
            .HasForeignKey(item => item.ContractId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ContractGroupMembership>()
            .HasOne(item => item.ContractGroup).WithMany(item => item.Memberships)
            .HasForeignKey(item => item.ContractGroupId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ContractParty>()
            .HasOne(item => item.DirectoryParty).WithMany()
            .HasForeignKey(item => item.DirectoryPartyId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ContractValue>()
            .Property(item => item.Amount)
            .HasPrecision(18, 2);
        modelBuilder.Entity<ContractTemplate>()
            .HasIndex(item => new { item.OrganizationId, item.Name, item.Version })
            .IsUnique();
        modelBuilder.Entity<ContractGenerationRun>()
            .HasIndex(item => new { item.OrganizationId, item.CreatedAtUtc });
        modelBuilder.Entity<ContractGenerationRun>()
            .HasOne(item => item.Contract).WithMany()
            .HasForeignKey(item => item.ContractId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ContractGenerationRun>()
            .HasOne(item => item.BaseDocumentVersion).WithMany()
            .HasForeignKey(item => item.BaseDocumentVersionId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ContractGenerationRun>()
            .HasOne(item => item.ContractTemplate).WithMany()
            .HasForeignKey(item => item.ContractTemplateId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<AuditLog>()
            .HasIndex(item => new { item.OrganizationId, item.CreatedAtUtc });
        modelBuilder.Entity<RuntimeSetting>()
            .HasIndex(item => new { item.OrganizationId, item.Category, item.Key })
            .IsUnique();
        modelBuilder.Entity<DocumentGroup>()
            .HasIndex(item => new { item.OrganizationId, item.Name })
            .IsUnique();
        modelBuilder.Entity<ContractTemplate>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ContractTemplate>().HasOne(x => x.ContractGroup).WithMany()
            .HasForeignKey(x => x.ContractGroupId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ContractYearDefinition>().HasIndex(x => new { x.OrganizationId, x.Year }).IsUnique();
        modelBuilder.Entity<ContractYearDefinition>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<DocumentGroup>().HasQueryFilter(item => !item.IsDeleted);
        modelBuilder.Entity<DocumentGroupMember>()
            .HasIndex(item => new { item.DocumentGroupId, item.DocumentId })
            .IsUnique();
        modelBuilder.Entity<ComplianceCriterion>().HasIndex(x => new { x.OrganizationId, x.Code }).IsUnique();
        modelBuilder.Entity<ComplianceCriterion>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ComplianceCriterion>().Property(x => x.DefaultWeight).HasPrecision(9, 2);
        modelBuilder.Entity<DocumentGroupCriterion>().HasIndex(x => new { x.DocumentGroupId, x.ComplianceCriterionId }).IsUnique();
        modelBuilder.Entity<DocumentGroupCriterion>().Property(x => x.Weight).HasPrecision(9, 2);
        modelBuilder.Entity<DocumentGroupCriterion>().HasOne(x => x.DocumentGroup).WithMany().HasForeignKey(x => x.DocumentGroupId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<DocumentGroupCriterion>().HasOne(x => x.ComplianceCriterion).WithMany().HasForeignKey(x => x.ComplianceCriterionId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<GoldenDocument>().HasIndex(x => new { x.DocumentGroupId, x.DocumentId }).IsUnique();
        modelBuilder.Entity<GoldenDocument>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<GoldenDocument>().HasOne(x => x.DocumentGroup).WithMany().HasForeignKey(x => x.DocumentGroupId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<GoldenDocument>().HasOne(x => x.Document).WithMany().HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<RuleSet>()
            .HasIndex(item => new { item.OrganizationId, item.Name, item.Version })
            .IsUnique();
        modelBuilder.Entity<RuleSet>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Rule>()
            .HasIndex(item => new { item.RuleSetId, item.Code })
            .IsUnique();
        modelBuilder.Entity<RuleParameter>()
            .HasIndex(item => new { item.RuleId, item.Key })
            .IsUnique();
        modelBuilder.Entity<ComparisonRun>()
            .HasIndex(item => new { item.OrganizationId, item.CreatedAtUtc });
        modelBuilder.Entity<ComparisonRun>()
            .Property(item => item.ScorePercent).HasPrecision(5, 2);
        modelBuilder.Entity<ComparisonRun>()
            .HasOne(item => item.TargetDocument).WithMany()
            .HasForeignKey(item => item.TargetDocumentId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ComparisonRun>()
            .HasOne(item => item.TargetVersion).WithMany()
            .HasForeignKey(item => item.TargetVersionId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ComparisonRun>()
            .HasOne(item => item.ReferenceDocument).WithMany()
            .HasForeignKey(item => item.ReferenceDocumentId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ComparisonRun>()
            .HasOne(item => item.ReferenceVersion).WithMany()
            .HasForeignKey(item => item.ReferenceVersionId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ComparisonRunRuleSet>()
            .HasKey(item => new { item.ComparisonRunId, item.RuleSetId });
        modelBuilder.Entity<ComparisonFinding>()
            .Property(item => item.Confidence).HasPrecision(5, 4);
        modelBuilder.Entity<ContractWorkflow>()
            .HasIndex(x => new { x.OrganizationId, x.ContractId, x.IsDeleted });
        modelBuilder.Entity<ContractWorkflow>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ContractWorkflowStage>()
            .HasIndex(x => new { x.ContractWorkflowId, x.Order }).IsUnique();
        modelBuilder.Entity<ContractRiskAssessment>()
            .HasIndex(x => new { x.OrganizationId, x.ContractId, x.CreatedAtUtc });
        modelBuilder.Entity<ContractRiskAssessment>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ContractOperation>()
            .HasIndex(x => new { x.OrganizationId, x.DueDate, x.Status, x.IsDeleted });
        modelBuilder.Entity<ContractOperation>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ContractOperation>().Property(x => x.Amount).HasPrecision(18, 2);

        modelBuilder.Entity<Organization>().HasData(new Organization
        {
            Id = KnownOrganizations.Development,
            Name = "NegareshAI Development Organization",
            CreatedAtUtc = DateTime.UnixEpoch
        });
    }
}
