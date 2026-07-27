namespace NegareshAI.Api.Contracts;

public sealed record RegisterDocumentRequest(Guid OrganizationId, string Title, string DocumentType, string FileId, string? OwnerUserId);
public sealed record DocumentResponse(Guid Id, string Title, string DocumentType, string FileId, DateTime CreatedAtUtc);
