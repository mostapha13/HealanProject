using Microsoft.EntityFrameworkCore;

namespace NegareshAI.Api.Data;

public sealed class NegareshDbContext(DbContextOptions<NegareshDbContext> options) : DbContext(options)
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<ContractTemplate> ContractTemplates => Set<ContractTemplate>();
    public DbSet<Checklist> Checklists => Set<Checklist>();
}

public sealed class Organization { public Guid Id { get; set; } = Guid.NewGuid(); public required string Name { get; set; } public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow; public List<Department> Departments { get; set; } = []; }
public sealed class Department { public Guid Id { get; set; } = Guid.NewGuid(); public Guid OrganizationId { get; set; } public required string Name { get; set; } public Organization? Organization { get; set; } }
public sealed class Document { public Guid Id { get; set; } = Guid.NewGuid(); public Guid OrganizationId { get; set; } public required string Title { get; set; } public required string DocumentType { get; set; } public string? OwnerUserId { get; set; } public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow; public List<DocumentVersion> Versions { get; set; } = []; }
public sealed class DocumentVersion { public Guid Id { get; set; } = Guid.NewGuid(); public Guid DocumentId { get; set; } public int VersionNumber { get; set; } public required string FileId { get; set; } public string? ExtractedText { get; set; } public Document? Document { get; set; } public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow; }
public sealed class ContractTemplate { public Guid Id { get; set; } = Guid.NewGuid(); public Guid OrganizationId { get; set; } public required string Name { get; set; } public required string ContractType { get; set; } public required string FileId { get; set; } public bool IsActive { get; set; } = true; }
public sealed class Checklist { public Guid Id { get; set; } = Guid.NewGuid(); public Guid OrganizationId { get; set; } public required string Name { get; set; } public required string DocumentType { get; set; } public required string ItemsJson { get; set; } public int Version { get; set; } = 1; public bool IsActive { get; set; } = true; }
