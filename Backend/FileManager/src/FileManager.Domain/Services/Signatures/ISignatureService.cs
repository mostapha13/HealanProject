using FileManager.Domain.DTOs.Signatures;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FileManager.Domain.Services.Signatures
{
    public interface ISignatureService
    {
        Task<ValidateCertificateResponse> ValidateCertificate(byte[] validateCertificate, CancellationToken cancellationToken);
        Task<PdfDigestForMultiSignResponse> PdfDigestForMultiSign(ValidateCertificateRequest validateRequest, CancellationToken cancellationToken);
        Task<PutPdfDigestForMultiSignResponse> PutPdfDigestForMultiSign(PutPdfDigestForMultiSignRequest request, CancellationToken cancellationToken);
    }
}
