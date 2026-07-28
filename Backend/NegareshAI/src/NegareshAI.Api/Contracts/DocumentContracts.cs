using NegareshAI.Api.Data;

namespace NegareshAI.Api.Contracts;

public sealed class UploadDocumentRequest
{
    public required IFormFile File { get; init; }
    public string? Title { get; init; }
    public string DocumentType { get; init; } = "contract";
    public ConfidentialityLevel ConfidentialityLevel { get; init; } = ConfidentialityLevel.Confidential;
}

public sealed record RegisterDocumentRequest(
    string Title,
    string DocumentType,
    string FileId,
    ConfidentialityLevel ConfidentialityLevel = ConfidentialityLevel.Confidential);

public sealed record DocumentResponse(
    Guid Id,
    Guid OrganizationId,
    string Title,
    string DocumentType,
    string FileId,
    ConfidentialityLevel ConfidentialityLevel,
    DocumentProcessingStatus ProcessingStatus,
    DateTime CreatedAtUtc);
