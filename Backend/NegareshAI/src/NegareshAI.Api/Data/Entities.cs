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

public enum DocumentVersionLifecycleStatus
{
    Uploaded = 1,
    Extracted = 2,
    ExpertReview = 3,
    ManagerReview = 4,
    Final = 5,
    Rejected = 6,
    Superseded = 7
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

public enum ComparisonBasisMode
{
    DocumentGroup = 1,
    RuleSets = 2,
    ReferenceDocument = 3,
    Combined = 4
}

public enum ComparisonRunStatus
{
    Running = 1,
    Completed = 2,
    NeedsReview = 3,
    Failed = 4
}

public enum ComparisonOutcome
{
    Compliant = 1,
    NonCompliant = 2,
    NeedsHumanReview = 3
}

public enum FindingType
{
    Matched = 1,
    Missing = 2,
    Forbidden = 3,
    Different = 4,
    Extra = 5
}

public enum FindingReviewDecision
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Corrected = 4
}

public enum ContractGenerationStatus
{
    NeedsClarification = 1,
    ReadyForReview = 2,
    Approved = 3,
    Rejected = 4,
    Failed = 5
}

public enum WorkflowStageType { Legal = 1, Technical = 2, Financial = 3, Managerial = 4, Expert = 5 }
public enum WorkflowDecision { Pending = 1, Approved = 2, RevisionRequested = 3, Rejected = 4 }
public enum ContractOperationType { Deadline = 1, Renewal = 2, Payment = 3, Guarantee = 4, Notice = 5, Obligation = 6 }
public enum ContractOperationStatus { Pending = 1, Completed = 2, Cancelled = 3, Overdue = 4 }
public enum RiskLevel { Low = 1, Medium = 2, High = 3, Critical = 4 }
public enum WorkflowActionType { Comment = 1, Approved = 2, RevisionRequested = 3, Rejected = 4, Delegated = 5 }
public enum OperationReminderKind { Upcoming = 1, Overdue = 2 }
public enum OperationReminderStatus { PendingDelivery = 1, Delivered = 2, Failed = 3 }
public enum DataScopeResourceType { ContractGroup = 1, DocumentGroup = 2 }
public enum DataScopeSubjectType { User = 1, Role = 2 }

public sealed class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? ChiefExecutiveName { get; set; }
    public string? ChiefExecutiveFatherName { get; set; }
    public string? ChiefExecutiveNationalId { get; set; }
    public string? NationalIdentifier { get; set; }
    public string? EconomicCode { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public string? UpdatedByUserId { get; set; }
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

public sealed class DataScopeAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public DataScopeResourceType ResourceType { get; set; }
    public Guid ResourceId { get; set; }
    public DataScopeSubjectType SubjectType { get; set; }
    public required string SubjectId { get; set; }
    public bool IsDenied { get; set; }
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
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
    public DocumentVersionLifecycleStatus LifecycleStatus { get; set; } = DocumentVersionLifecycleStatus.Uploaded;
    public string? ExtractedFieldsJson { get; set; }
    public string? ExtractionMetadataJson { get; set; }
    public string? ExpertReviewedByUserId { get; set; }
    public DateTime? ExpertReviewedAtUtc { get; set; }
    public string? ExpertReviewNote { get; set; }
    public string? ManagerReviewedByUserId { get; set; }
    public DateTime? ManagerReviewedAtUtc { get; set; }
    public string? ManagerReviewNote { get; set; }
    public bool IsRagPublished { get; set; }
    public DateTime? RagPublishedAtUtc { get; set; }
    public Document? Document { get; set; }
    public List<DocumentVersionFile> Files { get; set; } = [];
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public enum ComparisonApprovalStatus
{
    PendingExpertReview = 1,
    ExpertApproved = 2,
    ExpertRejected = 3,
    ManagerFinalized = 4
}

public enum ConflictDecisionScope
{
    Run = 1,
    DocumentGroup = 2
}

public enum ContractConversationStatus
{
    Active = 1,
    NeedsClarification = 2,
    InReview = 3,
    Completed = 4,
    Cancelled = 5
}

public enum ContractMessageRole { User = 1, Assistant = 2, System = 3 }
public enum ContractDraftApprovalStatus
{
    RequesterReview = 1,
    ExpertReview = 2,
    ManagerReview = 3,
    Final = 4,
    Rejected = 5
}

public sealed class DocumentVersionFile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DocumentVersionId { get; set; }
    public required string FileId { get; set; }
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public int SortOrder { get; set; }
    public int? PageNumber { get; set; }
    public required string Sha256 { get; set; }
    public long Size { get; set; }
    public DocumentVersion? DocumentVersion { get; set; }
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
    public Guid? StatusDefinitionId { get; set; }
    public Guid? BaseDocumentProfileId { get; set; }
    public Guid? PrimaryContractGroupId { get; set; }
    public decimal? Amount { get; set; }
    public string Currency { get; set; } = "IRR";
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? InternalOwnerUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public Document? Document { get; set; }
    public ContractStatusDefinition? StatusDefinition { get; set; }
    public ContractBaseDocumentProfile? BaseDocumentProfile { get; set; }
    public ContractGroup? PrimaryContractGroup { get; set; }
    public List<ContractGroupMembership> GroupMemberships { get; set; } = [];
    public List<ContractParty> Parties { get; set; } = [];
    public List<ContractClause> Clauses { get; set; } = [];
    public List<ContractValue> Values { get; set; } = [];
    public List<ContractDate> Dates { get; set; } = [];
    public List<ContractObligation> Obligations { get; set; } = [];
    public List<ContractWorkflow> Workflows { get; set; } = [];
    public List<ContractOperation> Operations { get; set; } = [];
    public List<ContractRiskAssessment> RiskAssessments { get; set; } = [];
}

/// <summary>A tenant-owned classification used for contracts, templates and data scope.</summary>
public sealed class ContractGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public List<ContractGroupMembership> Memberships { get; set; } = [];
}

public sealed class ContractGroupMembership
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractId { get; set; }
    public Guid ContractGroupId { get; set; }
    public bool IsPrimary { get; set; }
    public Contract? Contract { get; set; }
    public ContractGroup? ContractGroup { get; set; }
}

public sealed class ContractWorkflow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid ContractId { get; set; }
    public Guid? ContractGroupId { get; set; }
    public Guid? WorkflowDefinitionId { get; set; }
    public int? WorkflowDefinitionVersion { get; set; }
    public string DefinitionSnapshotJson { get; set; } = "[]";
    public WorkflowDecision Status { get; set; } = WorkflowDecision.Pending;
    public int CurrentStageOrder { get; set; } = 1;
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public Contract? Contract { get; set; }
    public List<ContractWorkflowStage> Stages { get; set; } = [];
    public List<ContractWorkflowAction> Actions { get; set; } = [];
}

public sealed class ContractWorkflowStage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractWorkflowId { get; set; }
    public WorkflowStageType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Order { get; set; }
    public string? AssignedUserId { get; set; }
    public string? DelegatedFromUserId { get; set; }
    public string? DelegatedByUserId { get; set; }
    public DateTime? DelegatedAtUtc { get; set; }
    public WorkflowDecision Decision { get; set; } = WorkflowDecision.Pending;
    public string? Comment { get; set; }
    public string? DecidedByUserId { get; set; }
    public DateTime? DecidedAtUtc { get; set; }
    public ContractWorkflow? Workflow { get; set; }
}

public sealed class ContractWorkflowDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DefinitionKey { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid? ContractGroupId { get; set; }
    public required string Name { get; set; }
    public int Version { get; set; } = 1;
    public required string StagesJson { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}

public sealed class ContractWorkflowAction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid ContractWorkflowId { get; set; }
    public Guid ContractWorkflowStageId { get; set; }
    public WorkflowActionType Type { get; set; }
    public string? Comment { get; set; }
    public string? FromUserId { get; set; }
    public string? ToUserId { get; set; }
    public required string PerformedByUserId { get; set; }
    public DateTime PerformedAtUtc { get; set; } = DateTime.UtcNow;
    public ContractWorkflow? Workflow { get; set; }
    public ContractWorkflowStage? Stage { get; set; }
}

public sealed class ContractRiskChecklistDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DefinitionKey { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid? ContractGroupId { get; set; }
    public required string Name { get; set; }
    public int Version { get; set; } = 1;
    public required string ItemsJson { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}

public sealed class ContractRiskAssessment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid ContractId { get; set; }
    public Guid? ChecklistDefinitionId { get; set; }
    public int? ChecklistDefinitionVersion { get; set; }
    public int Version { get; set; } = 1;
    public RiskLevel Level { get; set; }
    public int Score { get; set; }
    public required string ChecklistJson { get; set; }
    public string DefinitionSnapshotJson { get; set; } = "[]";
    public string? Summary { get; set; }
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public Contract? Contract { get; set; }
}

public sealed class ContractOperation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid ContractId { get; set; }
    public ContractOperationType Type { get; set; }
    public required string Title { get; set; }
    public DateOnly DueDate { get; set; }
    public decimal? Amount { get; set; }
    public string Currency { get; set; } = "IRR";
    public ContractOperationStatus Status { get; set; } = ContractOperationStatus.Pending;
    public int ReminderDaysBefore { get; set; } = 7;
    public string? AssignedUserId { get; set; }
    public string? CompletedByUserId { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? Description { get; set; }
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public Contract? Contract { get; set; }
    public List<ContractOperationReminder> Reminders { get; set; } = [];
}

public sealed class ContractOperationReminder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid ContractOperationId { get; set; }
    public required string DedupeKey { get; set; }
    public OperationReminderKind Kind { get; set; }
    public OperationReminderStatus Status { get; set; } = OperationReminderStatus.PendingDelivery;
    public DateOnly ScheduledFor { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public ContractOperation? Operation { get; set; }
}

public sealed class ContractParty
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractId { get; set; }
    public ContractPartyRole Role { get; set; }
    public Guid? DirectoryPartyId { get; set; }
    public required string Name { get; set; }
    public string? NationalIdentifier { get; set; }
    public string? RepresentativeName { get; set; }
    public Contract? Contract { get; set; }
    public OrganizationParty? DirectoryParty { get; set; }
}

public sealed class ContractStatusDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Name { get; set; }
    public int Order { get; set; }
    public string Color { get; set; } = "#6658df";
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}

public sealed class ContractBaseDocumentProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid DocumentId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public Document? Document { get; set; }
}

public sealed class OrganizationParty
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Name { get; set; }
    public string? NationalIdentifier { get; set; }
    public string? RepresentativeName { get; set; }
    public string? ContactInfo { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
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
    public Guid? ContractGroupId { get; set; }
    public int? ContractYear { get; set; }
    public DateOnly? EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public required string FileId { get; set; }
    public string? LetterheadFileId { get; set; }
    public string? LogoFileId { get; set; }
    public int Version { get; set; } = 1;
    public string? Description { get; set; }
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public ContractGroup? ContractGroup { get; set; }
}

public sealed class ContractYearDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public int Year { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}

public sealed class ApprovedContractClause
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid ContractGroupId { get; set; }
    public required string Code { get; set; }
    public required string Title { get; set; }
    public required string Text { get; set; }
    public int Order { get; set; }
    public bool IsRequired { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public ContractGroup? ContractGroup { get; set; }
}

public sealed class ContractGenerationRun
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid ContractId { get; set; }
    public Guid BaseDocumentVersionId { get; set; }
    public Guid ContractTemplateId { get; set; }
    public required string UserInstruction { get; set; }
    public required string ChangeSetJson { get; set; }
    public required string SourceSnapshotJson { get; set; }
    public required string CalculationSnapshotJson { get; set; }
    public required string DiffJson { get; set; }
    public string? ClarificationQuestionsJson { get; set; }
    public string? GeneratedDocxFileId { get; set; }
    public string? GeneratedPdfFileId { get; set; }
    public ContractGenerationStatus Status { get; set; }
    public required string ModelId { get; set; }
    public required string PromptVersion { get; set; }
    public required string CreatedByUserId { get; set; }
    public string? ReviewedByUserId { get; set; }
    public string? ReviewComment { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAtUtc { get; set; }
    public Contract? Contract { get; set; }
    public DocumentVersion? BaseDocumentVersion { get; set; }
    public ContractTemplate? ContractTemplate { get; set; }
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

public sealed class RuntimeSetting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Category { get; set; }
    public required string Key { get; set; }
    public required string ValueJson { get; set; }
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public string? UpdatedByUserId { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class DocumentGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public decimal PassingThreshold { get; set; } = 80m;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public List<DocumentGroupMember> Members { get; set; } = [];
    public List<RuleSet> RuleSets { get; set; } = [];
}

public sealed class DocumentGroupMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DocumentGroupId { get; set; }
    public Guid DocumentId { get; set; }
    public DocumentGroup? DocumentGroup { get; set; }
    public Document? Document { get; set; }
}

public sealed class ContractConversation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Title { get; set; }
    public Guid OrganizationPartyId { get; set; }
    public Guid PrimaryContractGroupId { get; set; }
    public int RequestedContractYear { get; set; }
    public required string Subject { get; set; }
    public Guid? BaseContractId { get; set; }
    public Guid? BaseDocumentVersionId { get; set; }
    public required string AdditionalSourceSnapshotJson { get; set; } = "[]";
    public ContractConversationStatus Status { get; set; } = ContractConversationStatus.Active;
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public OrganizationParty? OrganizationParty { get; set; }
    public ContractGroup? PrimaryContractGroup { get; set; }
    public Contract? BaseContract { get; set; }
    public DocumentVersion? BaseDocumentVersion { get; set; }
    public List<ContractConversationMessage> Messages { get; set; } = [];
    public List<ContractClarification> Clarifications { get; set; } = [];
    public List<ContractDraftVersion> Drafts { get; set; } = [];
}

public sealed class ContractConversationMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public int Sequence { get; set; }
    public ContractMessageRole Role { get; set; }
    public required string Content { get; set; }
    public string? SourceSnapshotJson { get; set; }
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public ContractConversation? Conversation { get; set; }
}

public sealed class ContractClarification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public required string Key { get; set; }
    public required string Question { get; set; }
    public string? Answer { get; set; }
    public bool IsAnswered { get; set; }
    public DateTime AskedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? AnsweredAtUtc { get; set; }
    public string? AnsweredByUserId { get; set; }
    public ContractConversation? Conversation { get; set; }
}

public sealed class ContractDraftVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public int VersionNumber { get; set; }
    public Guid? BaseContractId { get; set; }
    public Guid? BaseDocumentVersionId { get; set; }
    public Guid ContractTemplateId { get; set; }
    public required string InstructionSnapshot { get; set; }
    public required string ChangeSetJson { get; set; }
    public required string SourceSnapshotJson { get; set; }
    public required string CalculationSnapshotJson { get; set; }
    public required string DiffJson { get; set; }
    public required string ConflictAnalysisJson { get; set; }
    public required string GeneratedDocxFileId { get; set; }
    public string? GeneratedPdfFileId { get; set; }
    public ContractDraftApprovalStatus ApprovalStatus { get; set; } = ContractDraftApprovalStatus.RequesterReview;
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? RequesterReviewedByUserId { get; set; }
    public DateTime? RequesterReviewedAtUtc { get; set; }
    public string? RequesterReviewNote { get; set; }
    public string? ExpertReviewedByUserId { get; set; }
    public DateTime? ExpertReviewedAtUtc { get; set; }
    public string? ExpertReviewNote { get; set; }
    public string? ManagerReviewedByUserId { get; set; }
    public DateTime? ManagerReviewedAtUtc { get; set; }
    public string? ManagerReviewNote { get; set; }
    public Guid? FinalDocumentVersionId { get; set; }
    public ContractConversation? Conversation { get; set; }
    public Contract? BaseContract { get; set; }
    public DocumentVersion? BaseDocumentVersion { get; set; }
    public ContractTemplate? ContractTemplate { get; set; }
    public DocumentVersion? FinalDocumentVersion { get; set; }
}

public sealed class ComplianceCriterion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public required string Code { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public decimal DefaultWeight { get; set; } = 1;
    public bool IsCriticalByDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}
public sealed class DocumentGroupCriterion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DocumentGroupId { get; set; }
    public Guid ComplianceCriterionId { get; set; }
    public decimal Weight { get; set; }
    public bool IsCritical { get; set; }
    public int Order { get; set; }
    public DocumentGroup? DocumentGroup { get; set; }
    public ComplianceCriterion? ComplianceCriterion { get; set; }
}
public sealed class GoldenDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid DocumentGroupId { get; set; }
    public Guid DocumentId { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public DocumentGroup? DocumentGroup { get; set; }
    public Document? Document { get; set; }
}

public sealed class RuleSet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid? DocumentGroupId { get; set; }
    public required string Name { get; set; }
    public int Version { get; set; } = 1;
    public DateTime EffectiveFromUtc { get; set; } = DateTime.UtcNow;
    public DateTime? EffectiveToUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? UpdatedByUserId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? DeletedByUserId { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public DocumentGroup? DocumentGroup { get; set; }
    public List<Rule> Rules { get; set; } = [];
}

public sealed class Rule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RuleSetId { get; set; }
    public required string Code { get; set; }
    public required string Title { get; set; }
    public required string Instruction { get; set; }
    public int Severity { get; set; } = 2;
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
    public RuleSet? RuleSet { get; set; }
    public List<RuleParameter> Parameters { get; set; } = [];
}

public sealed class RuleParameter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RuleId { get; set; }
    public required string Key { get; set; }
    public required string ValueJson { get; set; }
    public Rule? Rule { get; set; }
}

public sealed class ComparisonRun
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid TargetDocumentId { get; set; }
    public Guid TargetVersionId { get; set; }
    public ComparisonBasisMode BasisMode { get; set; }
    public Guid? DocumentGroupId { get; set; }
    public Guid? ReferenceDocumentId { get; set; }
    public Guid? ReferenceVersionId { get; set; }
    public string? UserInstruction { get; set; }
    public required string RuleSetSnapshotJson { get; set; }
    public required string CriterionSnapshotJson { get; set; } = "[]";
    public required string SourceSnapshotJson { get; set; }
    public required string ToolTraceJson { get; set; } = "{}";
    public required string ModelId { get; set; }
    public required string PromptVersion { get; set; }
    public ComparisonRunStatus Status { get; set; } = ComparisonRunStatus.Running;
    public ComparisonOutcome? Outcome { get; set; }
    public decimal? ScorePercent { get; set; }
    public decimal PassingThreshold { get; set; } = 80m;
    public bool HasCriticalFailure { get; set; }
    public string? OutcomeExplanation { get; set; }
    public ComparisonApprovalStatus ApprovalStatus { get; set; } =
        ComparisonApprovalStatus.PendingExpertReview;
    public string? ExpertReviewedByUserId { get; set; }
    public DateTime? ExpertReviewedAtUtc { get; set; }
    public string? ExpertReviewNote { get; set; }
    public string? FailureReason { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }
    public Document? TargetDocument { get; set; }
    public DocumentVersion? TargetVersion { get; set; }
    public DocumentGroup? DocumentGroup { get; set; }
    public Document? ReferenceDocument { get; set; }
    public DocumentVersion? ReferenceVersion { get; set; }
    public List<ComparisonRunRuleSet> RuleSets { get; set; } = [];
    public List<ComparisonFinding> Findings { get; set; } = [];
    public List<ComparisonReportArtifact> Reports { get; set; } = [];
}

public sealed class ComparisonRunRuleSet
{
    public Guid ComparisonRunId { get; set; }
    public Guid RuleSetId { get; set; }
    public ComparisonRun? ComparisonRun { get; set; }
    public RuleSet? RuleSet { get; set; }
}

public sealed class ComparisonFinding
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComparisonRunId { get; set; }
    public Guid? RuleId { get; set; }
    public Guid? ComplianceCriterionId { get; set; }
    public FindingType Type { get; set; }
    public int Severity { get; set; }
    public decimal Weight { get; set; }
    public bool IsCritical { get; set; }
    public bool IsApplicable { get; set; } = true;
    public bool IsPassed { get; set; }
    public required string Title { get; set; }
    public required string Reason { get; set; }
    public string? TargetEvidence { get; set; }
    public int? TargetPage { get; set; }
    public string? TargetSection { get; set; }
    public string? ReferenceEvidence { get; set; }
    public int? ReferencePage { get; set; }
    public string? ReferenceSection { get; set; }
    public Guid? ReferenceDocumentId { get; set; }
    public Guid? ReferenceVersionId { get; set; }
    public string? Suggestion { get; set; }
    public decimal Confidence { get; set; }
    public FindingReviewDecision ReviewDecision { get; set; } =
        FindingReviewDecision.Pending;
    public string? ReviewerComment { get; set; }
    public string? CorrectedReason { get; set; }
    public string? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
    public ComparisonRun? ComparisonRun { get; set; }
    public Rule? Rule { get; set; }
    public ComplianceCriterion? ComplianceCriterion { get; set; }
}

public sealed class ComparisonConflictDecision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid ComparisonRunId { get; set; }
    public Guid ComparisonFindingId { get; set; }
    public Guid? DocumentGroupId { get; set; }
    public ConflictDecisionScope Scope { get; set; }
    public required string DecisionKey { get; set; }
    public FindingReviewDecision Decision { get; set; }
    public required string Reason { get; set; }
    public required string DecidedByUserId { get; set; }
    public DateTime DecidedAtUtc { get; set; } = DateTime.UtcNow;
    public ComparisonRun? ComparisonRun { get; set; }
    public ComparisonFinding? ComparisonFinding { get; set; }
    public DocumentGroup? DocumentGroup { get; set; }
}

public sealed class ComparisonReportArtifact
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ComparisonRunId { get; set; }
    public int Version { get; set; }
    public required string Format { get; set; }
    public required byte[] Content { get; set; }
    public required string Sha256 { get; set; }
    public required string SnapshotJson { get; set; }
    public required string GeneratedByUserId { get; set; }
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
    public ComparisonRun? ComparisonRun { get; set; }
}
