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

public sealed record DocumentListItemResponse(
    Guid Id,
    string Title,
    string DocumentType,
    int VersionCount,
    ConfidentialityLevel ConfidentialityLevel,
    DocumentProcessingStatus ProcessingStatus,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

public sealed record DocumentListResponse(
    IReadOnlyList<DocumentListItemResponse> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record UpdateDocumentRequest(
    string Title,
    string DocumentType,
    ConfidentialityLevel ConfidentialityLevel);

public sealed class UploadDocumentVersionRequest
{
    public required IFormFile File { get; init; }
    public string? ChangeSummary { get; init; }
}

public sealed record DocumentVersionResponse(
    Guid Id,
    int VersionNumber,
    string FileId,
    string? ChangeSummary,
    string? CreatedByUserId,
    DateTime CreatedAtUtc);

public sealed record DocumentDetailResponse(
    Guid Id,
    Guid OrganizationId,
    string Title,
    string DocumentType,
    ConfidentialityLevel ConfidentialityLevel,
    DocumentProcessingStatus ProcessingStatus,
    bool IsArchived,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyList<DocumentVersionResponse> Versions);

public sealed record FileDownloadResponse(
    Stream Content,
    string FileName,
    string ContentType);
