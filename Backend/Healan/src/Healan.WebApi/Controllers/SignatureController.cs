using Healan.Application.Signatures.Queries.PdfDigestForMultiSign;
using Healan.Application.Signatures.Queries.PutPdfDigestForMultiSign;
using Healan.Application.Signatures.Queries.ValidateCertificate;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;
/// <summary>
/// امضا دیجیتال
/// </summary>
[AccessForm(HealanAccessFormIds.Signature)]
public class SignatureController : ApiControllerBase
{
    /// <summary>
    /// معتبر بودن certificate
    /// </summary>
    /// <param name="validateCertificate"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public async Task<IActionResult> ValidateCertificate(ValidateCertificateQuery validateCertificate) =>
                                                            Ok(await Mediator.Send(validateCertificate));
    /// <summary>
    /// بدست آورد digest برای امضاء
    /// </summary>
    /// <param name="digestQuery"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public async Task<IActionResult> PdfDigestForMultiSign(PdfDigestForMultiSignQuery digestQuery) =>
                                                             Ok(await Mediator.Send(digestQuery));
    /// <summary>
    /// امضاء فایل
    /// </summary>
    /// <param name="digestQuery"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public async Task<IActionResult> PutPdfDigestForMultiSign(PutPdfDigestForMultiSignQuery digestQuery) =>
   Ok(await Mediator.Send(digestQuery));



}

