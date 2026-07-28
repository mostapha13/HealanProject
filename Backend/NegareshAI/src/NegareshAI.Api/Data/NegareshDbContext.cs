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
    public DbSet<Checklist> Checklists => Set<Checklist>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RuntimeSetting> RuntimeSettings => Set<RuntimeSetting>();

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
        modelBuilder.Entity<AuditLog>()
            .HasIndex(item => new { item.OrganizationId, item.CreatedAtUtc });
        modelBuilder.Entity<RuntimeSetting>()
            .HasIndex(item => new { item.OrganizationId, item.Category, item.Key })
            .IsUnique();

        modelBuilder.Entity<Organization>().HasData(new Organization
        {
            Id = KnownOrganizations.Development,
            Name = "NegareshAI Development Organization",
            CreatedAtUtc = DateTime.UnixEpoch
        });
    }
}
