using MediatR;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record UploadDocumentCommand(
    IFormFile File,
    string Title,
    string DocumentType,
    ConfidentialityLevel ConfidentialityLevel,
    string? BearerToken) : IRequest<DocumentResponse>;

public sealed class UploadDocumentCommandHandler(
    IFileManagerClient fileManager,
    ISender sender) : IRequestHandler<UploadDocumentCommand, DocumentResponse>
{
    public async Task<DocumentResponse> Handle(
        UploadDocumentCommand request,
        CancellationToken cancellationToken)
    {
        await using var stream = request.File.OpenReadStream();
        var fileId = await fileManager.UploadAsync(
            stream,
            request.File.FileName,
            request.File.ContentType,
            request.BearerToken,
            cancellationToken);

        return await sender.Send(
            new RegisterDocumentCommand(
                request.Title,
                request.DocumentType,
                fileId,
                request.ConfidentialityLevel),
            cancellationToken);
    }
}
