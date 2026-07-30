using Microsoft.EntityFrameworkCore;

namespace NegareshAI.Api.Data;

public sealed class NegareshDbContext(DbContextOptions<NegareshDbContext> options) : DbContext(options)
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<OrganizationMembership> OrganizationMemberships => Set<OrganizationMembership>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<DocumentAttachment> DocumentAttachments => Set<DocumentAttachment>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<ContractParty> ContractParties => Set<ContractParty>();
    public DbSet<ContractClause> ContractClauses => Set<ContractClause>();
    public DbSet<ContractValue> ContractValues => Set<ContractValue>();
    public DbSet<ContractDate> ContractDates => Set<ContractDate>();
    public DbSet<ContractObligation> ContractObligations => Set<ContractObligation>();
    public DbSet<ContractTemplate> ContractTemplates => Set<ContractTemplate>();
    public DbSet<ContractGenerationRun> ContractGenerationRuns => Set<ContractGenerationRun>();
    public DbSet<Checklist> Checklists => Set<Checklist>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RuntimeSetting> RuntimeSettings => Set<RuntimeSetting>();
    public DbSet<DocumentGroup> DocumentGroups => Set<DocumentGroup>();
    public DbSet<DocumentGroupMember> DocumentGroupMembers => Set<DocumentGroupMember>();
    public DbSet<RuleSet> RuleSets => Set<RuleSet>();
    public DbSet<Rule> Rules => Set<Rule>();
    public DbSet<RuleParameter> RuleParameters => Set<RuleParameter>();
    public DbSet<ComparisonRun> ComparisonRuns => Set<ComparisonRun>();
    public DbSet<ComparisonRunRuleSet> ComparisonRunRuleSets => Set<ComparisonRunRuleSet>();
    public DbSet<ComparisonFinding> ComparisonFindings => Set<ComparisonFinding>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrganizationMembership>()
            .HasIndex(item => new { item.OrganizationId, item.UserId })
            .IsUnique();
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
        modelBuilder.Entity<DocumentGroupMember>()
            .HasIndex(item => new { item.DocumentGroupId, item.DocumentId })
            .IsUnique();
        modelBuilder.Entity<RuleSet>()
            .HasIndex(item => new { item.OrganizationId, item.Name, item.Version })
            .IsUnique();
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

        modelBuilder.Entity<Organization>().HasData(new Organization
        {
            Id = KnownOrganizations.Development,
            Name = "NegareshAI Development Organization",
            CreatedAtUtc = DateTime.UnixEpoch
        });
    }
}
