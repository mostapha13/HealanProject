using FileManager.GrpcClient.Interfaces;
using Healan.Application.Signatures.Dtos;
using Healan.Application.Signatures.Queries.PdfDigestForMultiSign;
using MediatR;
using Microsoft.Extensions.Logging;
using Share.Domain.Extensions;

namespace Healan.Application.Signatures.Queries.PutPdfDigestForMultiSign;
public class PutPdfDigestForMultiSignQuery : PutPdfDigestForMultiSignRequest, IRequest<PutPdfDigestForMultiSignResult>
{
}


public class PutPdfDigestForMultiSignQueryHandler : IRequestHandler<PutPdfDigestForMultiSignQuery, PutPdfDigestForMultiSignResult>
{
    private readonly IFileManagerTool _fileManagerTool;
    private readonly ILogger<PutPdfDigestForMultiSignQueryHandler> _logger;

    public PutPdfDigestForMultiSignQueryHandler(ILogger<PutPdfDigestForMultiSignQueryHandler> logger, IFileManagerTool fileManagerTool)
    {
        _logger = logger;
        _fileManagerTool = fileManagerTool;
    }
    public async Task<PutPdfDigestForMultiSignResult> Handle(PutPdfDigestForMultiSignQuery request, CancellationToken cancellationToken)
    {
        var result = await _fileManagerTool.PutPdfDigestForMultiSign(request.Id, request.Sign, request.Certificate);
        return new PutPdfDigestForMultiSignResult
        {
            AttachmentId = result.AttachmentId.ToGuid().Value
        };
    }
}
