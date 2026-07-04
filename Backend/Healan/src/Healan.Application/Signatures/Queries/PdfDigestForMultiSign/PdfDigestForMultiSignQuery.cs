using FileManager.GrpcClient.Interfaces;
using Healan.Application.Signatures.Dtos;
using MediatR;
using Microsoft.Extensions.Logging;
using Share.Domain.Extensions;

namespace Healan.Application.Signatures.Queries.PdfDigestForMultiSign;

public class PdfDigestForMultiSignQuery : DigestRequest, IRequest<DigestResult>
{
}

public class GetDigestQueryHandler : IRequestHandler<PdfDigestForMultiSignQuery, DigestResult>
{
    private readonly IFileManagerTool _fileManagerTool;
    private readonly ILogger<GetDigestQueryHandler> _logger;

    public GetDigestQueryHandler(ILogger<GetDigestQueryHandler> logger, IFileManagerTool fileManagerTool)
    {
        _logger = logger;
        _fileManagerTool = fileManagerTool;
    }
    public async Task<DigestResult> Handle(PdfDigestForMultiSignQuery request, CancellationToken cancellationToken)
    {
        var result = await _fileManagerTool.PdfDigestForMultiSign(request.AttachmentId, request.Certificate, request.Reason, request.Location, request.ImageDataUrl, request.Page, request.LowerLeftX, request.LowerLeftY, request.UpperRightX, request.UpperRightY, request.HashAlgorithm);
        return new DigestResult
        {
            Error = result.Error,
            Id = result.Id.ToGuid().Value,
            Result = result.Result.ConvertToByteArray(),
            StatusCode = result.StatusCode,
        };


    }
}
