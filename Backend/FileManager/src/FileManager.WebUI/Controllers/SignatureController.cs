using FileManager.Domain.DTOs.Signatures;
using FileManager.Domain.Enums.Signatures;
using FileManager.Domain.Services.Signatures;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

namespace FileManager.WebUI.Controllers
{
    [ApiController]
    [Route("[controller]")]
#if DEBUG
    [AllowAnonymous]
#endif
#if !DEBUG
    [Authorize]
#endif
    public class SignatureController : ControllerBase
    {
        private readonly ISignatureService _signatureService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SignatureController> _logger;

        public SignatureController(ISignatureService signatureService, IConfiguration configuration, ILogger<SignatureController> logger)
        {
            _signatureService = signatureService;
            _configuration = configuration;
            _logger = logger;
        }




        [HttpPost("ValidateCertificate")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> ValidateCertificate(ValidateCertificateRequest validateCertificate, CancellationToken cancellationToken)
        {
            var validateCertificateResult = await _signatureService.ValidateCertificate(validateCertificate.Certificate, cancellationToken);
            return Ok(validateCertificateResult);
        }


        [HttpPost("PdfDigestForMultiSign")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> PdfDigestForMultiSign([FromForm] ValidateCertificateRequest request, CancellationToken cancellationToken)
        {
            var validateCertificateResult = await _signatureService.ValidateCertificate(request.Certificate, cancellationToken);
            if (validateCertificateResult != null && validateCertificateResult.Result.CertificateValidationStatus == (byte)CertificateValidationStatus.CertificateValidationOK)
            {
                var digest = await _signatureService.PdfDigestForMultiSign(request, cancellationToken);
                return Ok(digest);
            }
            else
            {
                return BadRequest();
            }
        }

        [HttpPost("PutPdfDigestForMultiSign")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> PutPdfDigestForMultiSign([FromForm] PutPdfDigestForMultiSignRequest request, CancellationToken cancellationToken)
        {
            var validateCertificateResult = await _signatureService.ValidateCertificate(request.Certificate, cancellationToken);
            if (validateCertificateResult != null && validateCertificateResult.Result.CertificateValidationStatus == (byte)CertificateValidationStatus.CertificateValidationOK)
            {
                var result = await _signatureService.PutPdfDigestForMultiSign(new PutPdfDigestForMultiSignRequest
                {
                    Certificate = request.Certificate,
                    Id = request.Id,
                    Sign = request.Sign,
                }, cancellationToken);
                return Ok(result.SignatureAttachmentId);
            }
            else
            {
                return BadRequest();
            }
        }
    }
}
