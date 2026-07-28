using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using NegareshAI.Api.Application.Documents.Commands;
using NegareshAI.Api.Application.Documents.Queries;
using NegareshAI.Api.Contracts;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public sealed class DocumentsController(ISender sender) : ControllerBase
{
    [HttpPost("upload")]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult<DocumentResponse>> Upload([FromForm] UploadDocumentRequest upload, CancellationToken cancellationToken = default)
    {
        var file = upload.File;
        if (file is null || file.Length == 0) return BadRequest("A non-empty file is required.");
        var allowed = new[] { "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
        if (!allowed.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase)) return BadRequest("Only PDF and DOCX files are supported.");
        var command = new UploadDocumentCommand(
            file,
            string.IsNullOrWhiteSpace(upload.Title) ? file.FileName : upload.Title,
            upload.DocumentType,
            upload.ConfidentialityLevel,
            Request.Headers.Authorization.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase));
        var response = await sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = response.Id }, response);
    }

    [HttpPost]
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await sender.Send(new DeleteDocumentCommand(id), cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
