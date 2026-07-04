using AutoMapper;
using DocumentFormat.OpenXml.InkML;
using FileManager.Domain.DTOs.Signatures;
using FileManager.Domain.Entities;
using FileManager.Domain.Enums.Signatures;
using FileManager.Domain.Services;
using FileManager.Domain.Services.Signatures;
using FileManager.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using RestSharp;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FileManager.Infrastructure.Services.Signatures
{
    public class SignatureService : ISignatureService
    {
        private readonly ILogger<SignatureService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IFileService _fileService;
        public string signatureUrl = "";
        public SignatureService(ILogger<SignatureService> logger, IConfiguration configuration, IApplicationDbContext applicationDbContext, IFileService fileService)
        {
            _logger = logger;
            _configuration = configuration;
            signatureUrl = _configuration["Signature:Url"];
            _applicationDbContext = applicationDbContext;
            _fileService = fileService;
        }

        public async Task<ValidateCertificateResponse> ValidateCertificate(byte[] validateCertificate, CancellationToken cancellationToken)
        {
            _logger.LogWarning($"Start ValidateCertificate");

            string signUrl = signatureUrl + "/api/VAService/ValidateCertificateEntirelyEx";
            var client = new RestClient(signUrl);
            var request = new RestRequest();
            request.Method = Method.Post;
            request.AddHeader("Content-Type", "application/json");

            var body = new { Certificate = validateCertificate, VaProfile = "" };
            request.AddJsonBody(body);

            var response = await client.ExecuteAsync(request);


            if (response.IsSuccessful)
            {
                var res = JsonConvert.DeserializeObject<ValidateCertificateResponse>(response.Content);
                return res;
            }
            else
            {
                _logger.LogError($"Error: {response.StatusCode} - {response.ErrorMessage}");
                return null;
            }
        }

        public async Task<PdfDigestForMultiSignResponse> PdfDigestForMultiSign(ValidateCertificateRequest validateRequest, CancellationToken cancellationToken)
        {
            _logger.LogWarning($"Start PdfDigestForMultiSign");

            string signUrl = signatureUrl + "/api/CryptoService/PDFDigestForMultiSign";
            var client = new RestClient(signUrl);
            var request = new RestRequest();
            request.Method = Method.Post;
            request.AddHeader("Content-Type", "application/json");

            var dateTime = DateTime.Now;
            var body = new PdfDigestForMultiSignRequest
            {
                PdfData = await validateRequest.file.ToBase64Async(),
                SignerCertificate =await validateRequest.Certificate.ToBase64Async(),

                DateTime = dateTime,
                CertificationLevel = 0,
                HashAlgoritm = validateRequest.HashAlgorithm == null ? (byte)HashAlgorithm.SHA1 : (byte)validateRequest.HashAlgorithm,
                ImageDataUrl = validateRequest.ImageDataUrl ?? "",
                Location = validateRequest.Location ?? "",
                Page = validateRequest.Page == 0 ? 1 : validateRequest.Page,
                Reason = validateRequest.Reason ?? "",
                SignatureFieldName = validateRequest.SignatureFieldName ?? validateRequest.file.FileName,            
                LowerLeftX = validateRequest.LowerLeftX,
                LowerLeftY = validateRequest.LowerLeftY,
                UpperRightX = validateRequest.UpperRightX,
                UpperRightY = validateRequest.UpperRightY,
                
            };

            //todo: addToDb


            request.AddJsonBody(body);

            var response = await client.ExecuteAsync(request);


            if (response.IsSuccessful)
            {
                var res = JsonConvert.DeserializeObject<PdfDigestForMultiSignResponse>(response.Content);
                return res;
            }
            else
            {
                _logger.LogError($"Error: {response.StatusCode} - {response.ErrorMessage}");
                return null;
            }
        }

        public async Task<PutPdfDigestForMultiSignResponse> PutPdfDigestForMultiSign(PutPdfDigestForMultiSignRequest request, CancellationToken cancellationToken)
        {
            _logger.LogWarning($"Start PutPdfSignatureForMultiSign");

            PdfSignature pdfSignature = await _applicationDbContext.PdfSignatures.FirstOrDefaultAsync(x => x.Id == request.Id);
            if (pdfSignature == null) throw new NotFoundExceptions("یافت نشد");



            string signUrl = _configuration["Dss:Url"] + "/api/CryptoService/PutPdfSignatureForMultiSign";
            var client = new RestClient(signUrl);
            var restRequest = new RestRequest();
            restRequest.Method = RestSharp.Method.Post;
            restRequest.AddHeader("Content-Type", "application/json");

            // download pdf data
            var fileData = await _fileService.DownloadFile(pdfSignature.AttachmentId, cancellationToken: cancellationToken);


            var body = new
            {
                PdfData = fileData,
                SignerCertificate = request.Certificate,
                DateTime = pdfSignature.RequestDate.Value,
                CertificationLevel = (int)pdfSignature.CertificationLevel,
                HashAlgoritm = (byte)pdfSignature.HashAlgorithm,
                ImageDataUrl = pdfSignature.ImageDataUrl,
                Location = pdfSignature.Location,
                Page = pdfSignature.Page,
                Reason = pdfSignature.Reason,
                SignatureFieldName = pdfSignature.FileName,
                LowerLeftX = pdfSignature.LowerLeftX,
                LowerLeftY = pdfSignature.LowerLeftY,
                UpperRightX = pdfSignature.UpperRightX,
                UpperRightY = pdfSignature.UpperRightY,
                Signature = request.Sign
            };

            restRequest.AddJsonBody(body);

            var response = await client.ExecuteAsync(restRequest);


            if (response.IsSuccessful)
            {
                var res = JsonConvert.DeserializeObject<PdfDigestForMultiSignResponse>(response.Content);



                // upload file to filemanager

                var uploadFileData = await _fileService.UploadFile(new Domain.DTOs.UploadFileRequest
                {
                    Stream = new MemoryStream(res.Result)
                });

                //update database 

                pdfSignature.SignatureAttachmentId = uploadFileData.FileId.ToGuid();

                _applicationDbContext.PdfSignatures.Update(pdfSignature);
                await _applicationDbContext.SaveChangesAsync(cancellationToken: cancellationToken);


                //todo Call filemanager service

                //res.Id = pdfSignature.Id;
                return new PutPdfDigestForMultiSignResponse
                {
                    SignatureAttachmentId = uploadFileData.FileId.ToGuid().Value
                };
            }
            else
            {
                _logger.LogError($"Error: {response.StatusCode} - {response.ErrorMessage}");
                throw new Exception($"Error: {response.StatusCode} - {response.ErrorMessage}");
            }
        }
    }
}
