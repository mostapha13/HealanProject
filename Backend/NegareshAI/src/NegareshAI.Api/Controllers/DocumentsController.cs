using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using NegareshAI.Api.Application.Documents.Commands;
using NegareshAI.Api.Application.Documents.Queries;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
[NegareshAccess(NegareshAIAccessFormIds.Documents)]
public sealed class DocumentsController(ISender sender) : ControllerBase
{
    private static readonly string[] AllowedContentTypes =
    [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg", "image/png", "image/tiff"
    ];

    [HttpGet]
    public async Task<ActionResult<DocumentListResponse>> List(
        [FromQuery] string? search,
        [FromQuery] string? documentType,
        [FromQuery] DocumentProcessingStatus? processingStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(
            new ListDocumentsQuery(search, documentType, processingStatus, page, pageSize),
            cancellationToken));

    [HttpPost("upload")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsCreate)]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult<DocumentResponse>> Upload([FromForm] UploadDocumentRequest upload, CancellationToken cancellationToken = default)
    {
        var file = upload.File;
        if (file is null || file.Length == 0) return BadRequest("A non-empty file is required.");
        if (!AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase)) return BadRequest("Only PDF and DOCX files are supported.");
        var command = new UploadDocumentCommand(
            file,
            string.IsNullOrWhiteSpace(upload.Title) ? file.FileName : upload.Title,
            upload.DocumentType,
            upload.ConfidentialityLevel,
            Request.Headers.Authorization.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase));
        var response = await sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = response.Id }, response);
    }

    [HttpPost("upload-batch")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsCreate)]
    [RequestSizeLimit(104_857_600)]
    public async Task<ActionResult<DocumentDetailResponse>> UploadBatch(
        [FromForm] UploadDocumentBatchRequest upload, CancellationToken cancellationToken = default)
    {
        var error = ValidateBatch(upload.Files, upload.PageNumbers);
        if (error is not null) return BadRequest(error);
        var images = upload.Files.All(IsImage);
        var pageNumbers = images
            ? (upload.PageNumbers.Count == 0
                ? Enumerable.Range(1, upload.Files.Count).ToArray()
                : upload.PageNumbers.ToArray())
            : Array.Empty<int>();
        var inputs = upload.Files.Select((file, index) => new IngestionFile(
            file, index + 1, images ? pageNumbers[index] : null)).ToArray();
        try
        {
            var response = await sender.Send(new UploadDocumentBatchCommand(
                inputs,
                string.IsNullOrWhiteSpace(upload.Title) ? upload.Files[0].FileName : upload.Title,
                upload.DocumentType, upload.ConfidentialityLevel, upload.DocumentGroupIds,
                Request.Headers.Authorization.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)),
                cancellationToken);
            return CreatedAtAction(nameof(Details), new { id = response.Id }, response);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpPost]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsCreate)]
    public async Task<ActionResult<DocumentResponse>> Register(RegisterDocumentRequest request, CancellationToken cancellationToken)
    {
        var response = await sender.Send(
            new RegisterDocumentCommand(
                request.Title,
                request.DocumentType,
                request.FileId,
                request.ConfidentialityLevel),
            cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = response.Id }, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DocumentResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var response = await sender.Send(new GetDocumentQuery(id), cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpGet("{id:guid}/details")]
    public async Task<ActionResult<DocumentDetailResponse>> Details(
        Guid id,
        [FromQuery] bool includeArchived,
        CancellationToken cancellationToken)
    {
        var response = await sender.Send(
            new GetDocumentDetailQuery(id, includeArchived), cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpGet("archived")]
    public async Task<IActionResult> Archived(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListArchivedDocumentsQuery(
            pageNumber, pageSize), cancellationToken));

    [HttpGet("{documentId:guid}/versions/{versionId:guid}/download")]
    public async Task<IActionResult> DownloadVersion(
        Guid documentId,
        Guid versionId,
        CancellationToken cancellationToken)
    {
        var response = await sender.Send(new DownloadDocumentVersionQuery(
            documentId,
            versionId,
            Request.Headers.Authorization.ToString()
                .Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)),
            cancellationToken);
        return response is null
            ? NotFound()
            : File(response.Content, response.ContentType, response.FileName);
    }

    [HttpPut("{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsEdit)]
    public async Task<ActionResult<DocumentResponse>> Update(
        Guid id,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest("Title is required.");
        if (string.IsNullOrWhiteSpace(request.DocumentType))
            return BadRequest("Document type is required.");

        var response = await sender.Send(
            new UpdateDocumentCommand(
                id,
                request.Title,
                request.DocumentType,
                request.ConfidentialityLevel),
            cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost("{id:guid}/versions")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsEdit)]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult<DocumentResponse>> UploadVersion(
        Guid id,
        [FromForm] UploadDocumentVersionRequest upload,
        CancellationToken cancellationToken)
    {
        var file = upload.File;
        if (file is null || file.Length == 0)
            return BadRequest("A non-empty file is required.");
        if (!AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            return BadRequest("Only PDF and DOCX files are supported.");

        var response = await sender.Send(
            new UploadDocumentVersionCommand(
                id,
                file,
                upload.ChangeSummary,
                Request.Headers.Authorization.ToString()
                    .Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)),
            cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpDelete("{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsDelete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await sender.Send(new DeleteDocumentCommand(id), cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/restore")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsEdit)]
    public async Task<IActionResult> Restore(Guid id, CancellationToken cancellationToken) =>
        await sender.Send(new RestoreDocumentCommand(id), cancellationToken)
            ? NoContent() : NotFound();

    [HttpPost("{id:guid}/process")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsEdit)]
    public async Task<IActionResult> Process(Guid id, CancellationToken cancellationToken) =>
        await sender.Send(new ProcessDocumentCommand(
                id,
                null,
                Request.Headers.Authorization.ToString()
                    .Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)),
            cancellationToken)
            ? Accepted() : NotFound();

    [HttpPut("{documentId:guid}/versions/{versionId:guid}/extracted-fields")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsEdit)]
    public async Task<ActionResult<DocumentDetailResponse>> SaveExtractedFields(
        Guid documentId, Guid versionId, ReviewExtractedFieldsRequest request, CancellationToken ct)
    {
        try
        {
            var result = await sender.Send(new SaveExtractedFieldsCommand(
                documentId, versionId, request.ExtractedFieldsJson), ct);
            return result is null ? NotFound() : Ok(result);
        }
        catch (System.Text.Json.JsonException)
        {
            return BadRequest("ExtractedFieldsJson must be valid JSON.");
        }
    }

    [HttpPost("{documentId:guid}/versions/{versionId:guid}/expert-review")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentsEdit)]
    public async Task<ActionResult<DocumentDetailResponse>> ExpertReview(
        Guid documentId, Guid versionId, DocumentReviewDecisionRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new ExpertReviewDocumentVersionCommand(
            documentId, versionId, request.Approved, request.Note), ct);
        return result is null ? Conflict("Version is not available for expert review.") : Ok(result);
    }

    [HttpPost("{documentId:guid}/versions/{versionId:guid}/manager-review")]
    [NegareshAccess(NegareshAIAccessFormIds.DocumentFinalizeRag)]
    public async Task<ActionResult<DocumentDetailResponse>> ManagerReview(
        Guid documentId, Guid versionId, DocumentReviewDecisionRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new ManagerReviewDocumentVersionCommand(
            documentId, versionId, request.Approved, request.Note), ct);
        return result is null ? Conflict("Version is not awaiting manager review.") : Ok(result);
    }

    private static string? ValidateBatch(IReadOnlyList<IFormFile> files, IReadOnlyList<int> pageNumbers)
    {
        if (files.Count == 0 || files.Any(x => x.Length == 0)) return "At least one non-empty file is required.";
        if (files.Any(x => !AllowedContentTypes.Contains(x.ContentType, StringComparer.OrdinalIgnoreCase)))
            return "Only PDF, DOCX, JPG, PNG and TIFF files are supported.";
        if (files.Sum(x => x.Length) > 104_857_600) return "Total upload size cannot exceed 100 MB.";
        var allImages = files.All(IsImage);
        if (!allImages && files.Count != 1) return "PDF and DOCX must be uploaded as a single file version.";
        if (!allImages && pageNumbers.Count > 0) return "Page numbers are only valid for image uploads.";
        if (allImages && pageNumbers.Count != 0 && pageNumbers.Count != files.Count)
            return "Every image must have exactly one page number.";
        if (pageNumbers.Any(x => x < 1) || pageNumbers.Distinct().Count() != pageNumbers.Count)
            return "Image page numbers must be positive and unique.";
        return null;
    }

    private static bool IsImage(IFormFile file) =>
        file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
}
