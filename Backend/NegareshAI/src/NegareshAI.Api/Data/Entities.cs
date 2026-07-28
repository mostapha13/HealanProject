namespace NegareshAI.Api.Data;

public static class KnownOrganizations
{
    public static readonly Guid Development = Guid.Parse("11111111-1111-1111-1111-111111111111");
}

public enum ConfidentialityLevel
{
    Internal = 1,
    Confidential = 2,
    HighlyConfidential = 3
}

public enum DocumentProcessingStatus
{
    Uploaded = 1,
    Processing = 2,
    Ready = 3,
    Failed = 4
}

public enum ContractStatus
{
    Draft = 1,
    UnderReview = 2,
    NeedsRevision = 3,
    Approved = 4,
    Signed = 5,
    Active = 6,
    Expired = 7,
    Terminated = 8,
    Archived = 9
}

public enum ContractPartyRole
{
    FirstParty = 1,
    SecondParty = 2,
    Guarantor = 3,
    Beneficiary = 4,
    Other = 5
}

public sealed class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public List<Department> Departments { get; set; } = [];
    public List<OrganizationMembership> Memberships { get; set; } = [];
}

public sealed class Department
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Name { get; set; }
    public Organization? Organization { get; set; }
}

public sealed class OrganizationMembership
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string UserId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public Organization? Organization { get; set; }
}

public sealed class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Title { get; set; }
    public required string DocumentType { get; set; }
    public string? OwnerUserId { get; set; }
    public ConfidentialityLevel ConfidentialityLevel { get; set; } = ConfidentialityLevel.Confidential;
    public DocumentProcessingStatus ProcessingStatus { get; set; } = DocumentProcessingStatus.Uploaded;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public Organization? Organization { get; set; }
    public Contract? Contract { get; set; }
    public List<DocumentVersion> Versions { get; set; } = [];
    public List<DocumentAttachment> Attachments { get; set; } = [];
}

public sealed class DocumentVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DocumentId { get; set; }
    public int VersionNumber { get; set; }
    public required string FileId { get; set; }
    public string? ExtractedText { get; set; }
    public string? ChangeSummary { get; set; }
    public string? CreatedByUserId { get; set; }
    public Document? Document { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class DocumentAttachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DocumentId { get; set; }
    public required string FileId { get; set; }
    public required string Title { get; set; }
    public string? AttachmentType { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public Document? Document { get; set; }
}

public sealed class Contract
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid DocumentId { get; set; }
    public string? ContractNumber { get; set; }
    public required string Subject { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Draft;
    public decimal? Amount { get; set; }
    public string Currency { get; set; } = "IRR";
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? InternalOwnerUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public Document? Document { get; set; }
    public List<ContractParty> Parties { get; set; } = [];
    public List<ContractClause> Clauses { get; set; } = [];
    public List<ContractValue> Values { get; set; } = [];
    public List<ContractDate> Dates { get; set; } = [];
    public List<ContractObligation> Obligations { get; set; } = [];
}

public sealed class ContractParty
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractId { get; set; }
    public ContractPartyRole Role { get; set; }
    public required string Name { get; set; }
    public string? NationalIdentifier { get; set; }
    public string? RepresentativeName { get; set; }
    public Contract? Contract { get; set; }
}

public sealed class ContractClause
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractId { get; set; }
    public required string ClauseNumber { get; set; }
    public required string Title { get; set; }
    public required string Text { get; set; }
    public int Order { get; set; }
    public Contract? Contract { get; set; }
}

public sealed class ContractValue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractId { get; set; }
    public required string ValueType { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "IRR";
    public string? Description { get; set; }
    public Contract? Contract { get; set; }
}

public sealed class ContractDate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractId { get; set; }
    public required string DateType { get; set; }
    public DateOnly Value { get; set; }
    public string? Description { get; set; }
    public Contract? Contract { get; set; }
}

public sealed class ContractObligation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractId { get; set; }
    public Guid? ResponsiblePartyId { get; set; }
    public required string Description { get; set; }
    public DateOnly? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public Contract? Contract { get; set; }
}

public sealed class ContractTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Name { get; set; }
    public required string ContractType { get; set; }
    public required string FileId { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Checklist
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Name { get; set; }
    public required string DocumentType { get; set; }
    public required string ItemsJson { get; set; }
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

public sealed class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string UserId { get; set; }
    public required string Action { get; set; }
    public required string EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
