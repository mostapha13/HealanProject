using FileManager.GrpcClient.Interfaces;
using Healan.Application.Signatures.Dtos;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Healan.Application.Signatures.Queries.ValidateCertificate;

public class ValidateCertificateQuery : ValidateCertificateRequest, IRequest<ValidateCertificateResult>
{
}

public class ValidateCertificateQueryHandler : IRequestHandler<ValidateCertificateQuery, ValidateCertificateResult>
{
    private readonly IFileManagerTool _fileManagerTool;
    private readonly ILogger<ValidateCertificateQueryHandler> _logger;

    public ValidateCertificateQueryHandler(ILogger<ValidateCertificateQueryHandler> logger, IFileManagerTool fileManagerTool)
    {
        _logger = logger;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<ValidateCertificateResult> Handle(ValidateCertificateQuery request, CancellationToken cancellationToken)
    {
        _logger.LogWarning($"Start ValidateCertificate");

        //  var res = await _fileManagerTool.GetFileReplyInfo(new Guid("4A01C6F5-2FF5-47D5-ABB9-1D6AF96AC455"));
        var result = await _fileManagerTool.ValidateCertificateClient(request.Certificate);

        //return new ValidateCertificateResult
        //{
        //    Error = result?.Error,
        //    Result = new ValidateCertificateDto
        //    {
        //        //RevocationTime = result?.Result?.RevocationTime?.ToDateTime(),
        //        //CertificateValidationStatus = result?.Result?.CertificateValidationStatus,
        //    },
        //    StatusCode = result?.StatusCode,
        //};
        return new ValidateCertificateResult();
    }
}
