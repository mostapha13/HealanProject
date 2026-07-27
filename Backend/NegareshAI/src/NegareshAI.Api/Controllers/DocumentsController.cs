using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public sealed class DocumentsController(NegareshDbContext db, IFileManagerClient fileManager) : ControllerBase
{
    [HttpPost("upload")]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult<DocumentResponse>> Upload([FromForm] IFormFile file, [FromForm] Guid organizationId, [FromForm] string? title, [FromForm] string documentType = "contract", CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0) return BadRequest("A non-empty file is required.");
        var allowed = new[] { "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
        if (!allowed.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase)) return BadRequest("Only PDF and DOCX files are supported.");
        await using var stream = file.OpenReadStream();
        var fileId = await fileManager.UploadAsync(stream, file.FileName, file.ContentType, Request.Headers.Authorization.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase), cancellationToken);
        var request = new RegisterDocumentRequest(organizationId, string.IsNullOrWhiteSpace(title) ? file.FileName : title, documentType, fileId, User.Identity?.Name);
        return await Register(request, cancellationToken);
    }

    [HttpPost]
    public async Task<ActionResult<DocumentResponse>> Register(RegisterDocumentRequest request, CancellationToken cancellationToken)
    {
        var document = new Document { OrganizationId = request.OrganizationId, Title = request.Title, DocumentType = request.DocumentType, OwnerUserId = request.OwnerUserId };
        document.Versions.Add(new DocumentVersion { DocumentId = document.Id, VersionNumber = 1, FileId = request.FileId });
        db.Documents.Add(document);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = document.Id }, new DocumentResponse(document.Id, document.Title, document.DocumentType, request.FileId, document.CreatedAtUtc));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DocumentResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var document = await db.Documents.FindAsync([id], cancellationToken);
        return document is null ? NotFound() : Ok(new DocumentResponse(document.Id, document.Title, document.DocumentType, document.Versions.FirstOrDefault()?.FileId ?? "", document.CreatedAtUtc));
    }
}
