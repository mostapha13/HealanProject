using FileManager.Domain.DTOs.Signatures;
using FileManager.Domain.Entities;
using FileManager.Domain.Services;
using FileManager.GrpcServer.CachedModel;
using FileManager.Infrastructure.Persistence;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using RestSharp;
using Share.Application.Common.Cache;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
namespace FileManager.GrpcServer.Services
{
    public class FileManagerService : IFileManagerService.IFileManagerServiceBase
    {
        private readonly ILogger<FileManagerService> _logger;
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ICacheManager<FileReplyCached> _cacheManager;
        private readonly IConfiguration _configuration;
        private readonly IFileService _fileService;
        public FileManagerService(ILogger<FileManagerService> logger, IApplicationDbContext applicationDbContext, ICacheManager<FileReplyCached> cacheManager, IConfiguration configuration, IFileService fileService)
        {
            _logger = logger;
            _applicationDbContext = applicationDbContext;
            _cacheManager = cacheManager;
            _configuration = configuration;
            _fileService = fileService;
        }

        public async override Task<FileReply> GetFileInfos(FilesRequest request, ServerCallContext context)
        {
            var allFileId = request.FileId.Select(s => Guid.Parse(s)).ToArray();
            var allFiles = _applicationDbContext.Files.Where(s => allFileId.Contains(s.Id)).ToList();

            FileReplyCached fileReplyCached = new FileReplyCached(allFileId);
            //var cashResult = await _cacheManager.Get(fileReplyCached);
            //if (cashResult.IsHit)
            //    return cashResult.Data.FileReply;
            var fileInfos = allFiles.Select(s =>
              new FileReplyInfo
              {
                  FileId = s.Id.ToString(),
                  FileName = s.OriginalFilename,
                  Link = s.Link,
                  UnixCreateDate = (int)s.CreatedAt.ToUniversalTime().Subtract(new DateTime(1970, 1, 1)).TotalSeconds,
                  FileType = s.FileTypeId.ToString(),
                  FileTypeName = s.FileTypeId.GetDisplayName(),
                  FileSize = s.FileSize
              }).ToList();
            FileReply fileReply = new FileReply();
            foreach (var item in fileInfos)
            {
                fileReply.FileReplyInfos.Add(item);
            }

            fileReplyCached.FileReply = fileReply;
            //await _cacheManager.Set(fileReplyCached, fileReplyCached);


            return fileReply;
        }

        public async override Task<TopPopularFileReply> GetTopPopularReplyInfo(TopPopularRequest request, ServerCallContext context)
        {
            //var qq = from c in _context.Files
            //         select new { ssss = ApplicationDbContext.JsonValue(c.JsonInfo, "$.Name") };

            //var jjj = qq.ToList();
            TopPopularFileReply topTenPopularFileReply = new TopPopularFileReply();
            var allFiles = from s in _applicationDbContext.Files
                           where !string.IsNullOrEmpty(s.JsonInfo)
                           && ApplicationDbContext.ISJSON(s.JsonInfo)
                           && ApplicationDbContext.JsonValue(s.JsonInfo, "$.SubSystem") == request.SubSystem.ToString()
                           && ApplicationDbContext.JsonValue(s.JsonInfo, "$.System") == request.System.ToString()
                           select new TopPopularReplyInfo
                           {
                               FileId = s.Id.ToString(),
                               FileName = s.OriginalFilename,
                               Link = s.Link,
                               UnixCreateDate = (int)s.CreatedAt.ToUniversalTime().Subtract(new DateTime(1970, 1, 1)).TotalSeconds,
                               FileType = s.FileTypeId.ToString(),
                               FileTypeName = s.FileTypeId.GetDisplayName(),
                               FileSize = s.FileSize,
                               DownloadedCount = s.DownloadedCount
                           };

            //var zzz=allFiles.ToQueryString();


            var result = allFiles.OrderByDescending(o => o.DownloadedCount).Take(10).ToList();
            foreach (var item in result)
            {
                topTenPopularFileReply.TopPopularReplyInfos.Add(item);
            }
            return topTenPopularFileReply;

        }


        public async override Task<FileSearchReply> SearchFile(FilesSearchRequest request, ServerCallContext context)
        {
            if (request == null)
                return null;
            var fromDate = DateTimeHelper.UnixTimeStampToDateTime(request.From);
            var toDate = DateTimeHelper.UnixTimeStampToDateTime(request.To);

            FileSearchReply fileSearchReply = new FileSearchReply();
            var allFiles = from s in _applicationDbContext.Files
                           where
                           (string.IsNullOrEmpty(request.FileName) || s.OriginalFilename.ToLower().Contains(request.FileName.ToLower())) &&
                           (request.From == 0 || s.CreatedAt >= fromDate) &&
                           (request.To == 0 || s.CreatedAt <= toDate) &&
                           (request.System == 0 || !string.IsNullOrEmpty(s.JsonInfo) && ApplicationDbContext.JsonValue(s.JsonInfo, "$.System") == request.System.ToString()) &&
                           (request.SubSystem == 0 || !string.IsNullOrEmpty(s.JsonInfo) && ApplicationDbContext.JsonValue(s.JsonInfo, "$.SubSystem") == request.SubSystem.ToString())

                           select new FileSearchReplyInfo
                           {
                               FileId = s.Id.ToString(),
                               FileName = s.OriginalFilename,
                               Link = s.Link,
                               UnixCreateDate = (int)s.CreatedAt.ToUniversalTime().Subtract(new DateTime(1970, 1, 1)).TotalSeconds,
                               FileType = s.FileTypeId.ToString(),
                               FileTypeName = s.FileTypeId.GetDisplayName(),
                               FileSize = s.FileSize,
                           };

            var result = allFiles.ToList();
            foreach (var item in result)
            {
                fileSearchReply.FileSearchReplyInfos.Add(item);
            }
            return fileSearchReply;
        }

        public async override Task<ValidateCertificateReply> ValidateCertificate(ValidateCertificateRequest request, ServerCallContext context)
        {

            string signUrl = _configuration["Dss:Url"] + "/api/VAService/ValidateCertificateEntirelyEx";
            var client = new RestClient(signUrl);
            var restRequest = new RestRequest();
            restRequest.Method = RestSharp.Method.Post;
            restRequest.AddHeader("Content-Type", "application/json");

            var body = new { request.Certificate, VaProfile = "" };
            restRequest.AddJsonBody(body);

            var response = await client.ExecuteAsync(restRequest);

            ValidateCertificateResponse res = null;
            if (response.IsSuccessful)
            {
                res = JsonConvert.DeserializeObject<ValidateCertificateResponse>(response?.Content);
                return new ValidateCertificateReply
                {

                    Error = res?.Error,
                    StatusCode = res.StatusCode,
                    Result = new ValidateCertificateResult
                    {
                        CertificateValidationStatus = res.Result.CertificateValidationStatus,
                        RevocationTime = res.Result?.RevocationTime.ToTimestamp(),
                    }
                };
            }
            else
            {
                _logger.LogError($"Error: {response?.StatusCode} - {response?.ErrorMessage}");
                return new ValidateCertificateReply
                {
                    Error = response?.ErrorMessage,
                    StatusCode = (int)response?.StatusCode
                };
            }

        }

        public async override Task<PdfDigestForMultiSignReply> PdfDigestForMultiSign(PdfDigestForMultiSignRequest request, ServerCallContext context)
        {


            _logger.LogWarning($"Start PdfDigestForMultiSign");

            string signUrl = _configuration["Dss:Url"] + "/api/CryptoService/PDFDigestForMultiSign";
            var client = new RestClient(signUrl);
            var restRequest = new RestRequest();
            restRequest.Method = RestSharp.Method.Post;
            restRequest.AddHeader("Content-Type", "application/json");
            var dateTime = DateTime.Now;


            // Get data from filemanager by attachmentId

            var fileInfo = await _applicationDbContext.Files.FirstOrDefaultAsync(x => x.Id == request.AttachmentId.ToGuid());

            var fileData = await _fileService.DownloadFile(request.AttachmentId.ToGuid().Value, cancellationToken: context.CancellationToken);


            //2 Call api
            var body = new
            {
                request.SignerCertificate,
                request.HashAlgorithm,
                request.ImageDataUrl,
                Location = request.Location ?? "",
                Reason = request.Reason ?? "",
                Page = request.Page == 0 ? 1 : request.Page,
                request.LowerLeftX,
                request.LowerLeftY,
                request.UpperRightX,
                request.UpperRightY,
                CertificationLevel = 0,
                DateTime = dateTime,
                SignatureFieldName = fileInfo.OriginalFilename ?? "",
                PdfData = fileData.FileStream.ConvertToByteArray(),
            };
            restRequest.AddJsonBody(body);

            var response = await client.ExecuteAsync(restRequest);
            if (response.IsSuccessful)

            {
                var res = JsonConvert.DeserializeObject<PdfDigestForMultiSignResponse>(response.Content);

                //3- Add to DB 
                var pdfSignature = await _applicationDbContext.PdfSignatures
                    .Where(x => x.AttachmentId == request.AttachmentId.ToGuid()).FirstOrDefaultAsync();
                if (pdfSignature is null)
                {
                    pdfSignature = new PdfSignature();
                    await _applicationDbContext.PdfSignatures.AddAsync(pdfSignature);
                }

                pdfSignature.HashAlgorithm = (Share.Domain.Enums.HashAlgorithmType)request.HashAlgorithm;
                pdfSignature.ImageDataUrl = request.ImageDataUrl;
                pdfSignature.Location = request.Location;
                pdfSignature.Page = request.Page ?? 1;
                pdfSignature.LowerLeftX = request.LowerLeftX;
                pdfSignature.LowerLeftY = request.LowerLeftY;
                pdfSignature.UpperRightX = request.UpperRightX;
                pdfSignature.UpperRightY = request.UpperRightY;
                pdfSignature.CertificationLevel = CertificationLevelType.Zero;
                pdfSignature.Reason = request.Reason;
                pdfSignature.RequestDate = dateTime;
                pdfSignature.FileName = fileInfo.OriginalFilename;
                pdfSignature.Digest = res.Result;
                pdfSignature.AttachmentId = fileInfo.Id;
                pdfSignature.Certificate = request.SignerCertificate.ToByteArray();



                await _applicationDbContext.SaveChangesAsync(context.CancellationToken);

                return new PdfDigestForMultiSignReply
                {
                    Id = pdfSignature.Id.ToString(),
                    Error = res?.Error,
                    StatusCode = res.StatusCode,
                    Result = Convert.ToBase64String(res.Result)
                };
            }
            else
            {
                _logger.LogError($"Error: {response.StatusCode} - {response.ErrorMessage}");
                return null;
            }

        }

        public async override Task<PutPdfDigestForMultiSignReply> PutPdfDigestForMultiSign(PutPdfDigestForMultiSignRequest request, ServerCallContext context)
        {
            _logger.LogWarning($"Start PutPdfSignatureForMultiSign");

            PdfSignature pdfSignature = await _applicationDbContext.PdfSignatures.FirstOrDefaultAsync(x => x.Id == request.Id.ToGuid());
            if (pdfSignature == null) throw new NotFoundExceptions("یافت نشد");



            string signUrl = _configuration["Dss:Url"] + "/api/CryptoService/PutPdfSignatureForMultiSign";
            var client = new RestClient(signUrl);
            var restRequest = new RestRequest();
            restRequest.Method = RestSharp.Method.Post;
            restRequest.AddHeader("Content-Type", "application/json");

            // Download pdf data
            var fileData = await _fileService.DownloadFile(pdfSignature.AttachmentId, cancellationToken: context.CancellationToken);


            var body = new
            {
                PdfData = fileData.FileStream.ConvertToByteArray(),
                SignerCertificate = request.Certificate,
                DateTime = pdfSignature.RequestDate.Value,
                CertificationLevel = (int)pdfSignature.CertificationLevel,
                HashAlgoritm = (byte)pdfSignature.HashAlgorithm,
                pdfSignature.ImageDataUrl,
                pdfSignature.Location,
                pdfSignature.Page,
                pdfSignature.Reason,
                SignatureFieldName = pdfSignature.FileName,
                pdfSignature.LowerLeftX,
                pdfSignature.LowerLeftY,
                pdfSignature.UpperRightX,
                pdfSignature.UpperRightY,
                Signature = request.Sign.ToByteArray(),
            };

            restRequest.AddJsonBody(body);

            var response = await client.ExecuteAsync(restRequest);


            if (response.IsSuccessful)
            {
                var res = JsonConvert.DeserializeObject<PdfDigestForMultiSignResponse>(response.Content);



                // Upload file to filemanager

                var uploadFileData = await _fileService.UploadFile(new Domain.DTOs.UploadFileRequest
                {
                    Stream = new MemoryStream(res.Result)
                });

                // Update database 

                pdfSignature.SignatureAttachmentId = uploadFileData.FileId.ToGuid();
                pdfSignature.Certificate = request.Certificate.ToByteArray();

                _applicationDbContext.PdfSignatures.Update(pdfSignature);
                await _applicationDbContext.SaveChangesAsync(cancellationToken: context.CancellationToken);


                // Todo Call filemanager service

                // res.Id = pdfSignature.Id;
                return new PutPdfDigestForMultiSignReply
                {
                    AttachmentId = uploadFileData.FileId
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
