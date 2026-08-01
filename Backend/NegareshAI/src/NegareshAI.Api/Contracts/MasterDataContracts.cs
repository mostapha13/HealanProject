namespace NegareshAI.Api.Contracts;

public sealed record ComplianceCriterionResponse(Guid Id, string Code, string Title, string? Description, decimal DefaultWeight, bool IsCriticalByDefault, bool IsActive);
public sealed record SaveComplianceCriterionRequest(string Code, string Title, string? Description, decimal DefaultWeight, bool IsCriticalByDefault, bool IsActive = true);
public sealed record DocumentGroupCriterionResponse(Guid Id, Guid ComplianceCriterionId, string Code, string Title, decimal Weight, bool IsCritical, int Order);
public sealed record SaveDocumentGroupCriteriaRequest(IReadOnlyCollection<SaveDocumentGroupCriterionItem> Items);
public sealed record SaveDocumentGroupCriterionItem(Guid ComplianceCriterionId, decimal Weight, bool IsCritical, int Order);
public sealed record GoldenDocumentResponse(Guid Id, Guid DocumentGroupId, Guid DocumentId, string DocumentTitle, int Priority, bool IsActive);
public sealed record SaveGoldenDocumentRequest(Guid DocumentGroupId, Guid DocumentId, int Priority, bool IsActive = true);
