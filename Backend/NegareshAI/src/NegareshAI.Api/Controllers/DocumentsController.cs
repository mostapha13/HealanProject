using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public sealed class DocumentsController(NegareshDbContext db) : ControllerBase
{
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
