using FileManager.GrpcClient.Interfaces;
using FileManagerClient;
using Google.Protobuf;
using Grpc.Net.Client;
using Microsoft.Extensions.Configuration;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace FileManager.GrpcClient.Services
{
    internal class FileManagerTool : IFileManagerTool
    {
        FileManagerClient.IFileManagerService.IFileManagerServiceClient client;
        public FileManagerTool(IConfiguration configuration)
        {
            var address = ResolveFileManagerGrpcAddress(configuration);
            var httpHandler = new HttpClientHandler();
            httpHandler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            var channel = GrpcChannel.ForAddress(address, new GrpcChannelOptions { HttpHandler = httpHandler });
            client = new IFileManagerService.IFileManagerServiceClient(channel);
        }

        private static string ResolveFileManagerGrpcAddress(IConfiguration configuration)
        {
            var address = configuration["GrpcServer:FileManager"]?.Trim();
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "";
            var inContainer = string.Equals(
                Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"),
                "true",
                StringComparison.OrdinalIgnoreCase);

            if ((env.Equals("Production", StringComparison.OrdinalIgnoreCase) || inContainer)
                && (string.IsNullOrWhiteSpace(address)
                    || address.Contains("localhost", StringComparison.OrdinalIgnoreCase)))
            {
                return "http://filemanager-grpc:8080";
            }

            return string.IsNullOrWhiteSpace(address) ? "http://localhost:5060" : address;
        }

        public async Task<FileReplyInfo> GetFileReplyInfo(Guid fileId)
        {
            var infos = await GetFileReplyInfos(new List<Guid>() { fileId });
            var result = infos.FirstOrDefault();
            if (result == null)
                return new FileReplyInfo();
            return result;
        }

        public async Task<List<FileReplyInfo>> GetFileReplyInfos(List<Guid> fileIds)
        {
#if DEBUG
            List<FileReplyInfo> fileInfosss = new List<FileReplyInfo>();
            foreach (var item in fileIds)
            {
                fileInfosss.Add(new FileReplyInfo() { FileId = item.ToString(), FileName = "Test", FileType = "Image" });
            }
            return fileInfosss;

#endif
            FilesRequest fileRequest = new FilesRequest();
            foreach (var item in fileIds)
            {
                fileRequest.FileId.Add(item.ToString());
            }
            var result = await client.GetFileInfosAsync(fileRequest);
            return result.FileReplyInfos.ToList();
        }

        public async Task<TopPopularFileReply> GetTopPopularFileReplyInfo(int SystemTypeId, int subSystemTypeId, int pageSize)
        {
            TopPopularRequest fileRequest = new TopPopularRequest() { System = SystemTypeId, SubSystem = subSystemTypeId, PageSize = pageSize };
            var result = client.GetTopPopularReplyInfo(fileRequest);
            return result;
        }



        public async Task<FileSearchReply> SearchFile(int? system, int? subSystem, string FileName, DateTime? from, DateTime? to)
        {
            long fromDate = 0;
            long toDate = 0;
            if (from.HasValue)
                fromDate = DateTimeHelper.DateTimeToUnixTimeStamp(from.Value);
            if (to.HasValue)
                toDate = DateTimeHelper.DateTimeToUnixTimeStamp(to.Value);
            FilesSearchRequest fileRequest = new FilesSearchRequest() { System = system ?? 0, SubSystem = subSystem ?? 0, FileName = FileName, From = fromDate, To = toDate };
            var result = await client.SearchFileAsync(fileRequest);
            return result;
        }

        public async Task<ValidateCertificateReply> ValidateCertificateClient(byte[] certificate)
        {
            var result = await client.ValidateCertificateAsync(new ValidateCertificateRequest { Certificate = ByteString.CopyFrom(certificate) });
            return result;

        }

        public async Task<PdfDigestForMultiSignReply> PdfDigestForMultiSign(Guid attachmentId, byte[] certificate, string reason, string location, string imageDataUrl, int? page, float? lowerLeftX, float? lowerLeftY, float? upperRightX, float? upperRightY, Share.Domain.Enums.HashAlgorithmType? hashAlgorithm)
        {
            if (certificate is null) throw new BadRequestExceptions();


            var validateCertificateResult = await client.ValidateCertificateAsync(new ValidateCertificateRequest { Certificate = ByteString.CopyFrom(certificate) });
            if (validateCertificateResult != null && validateCertificateResult.Result.CertificateValidationStatus == (byte)CertificateValidationStatus.CertificateValidationOK)

            {

                var data = new PdfDigestForMultiSignRequest
                {
                    AttachmentId = attachmentId.ToString(),
                    HashAlgorithm =(FileManagerClient.HashAlgorithmType) hashAlgorithm,
                    ImageDataUrl = imageDataUrl,
                    Location = location,
                    LowerLeftX = lowerLeftX,
                    LowerLeftY = lowerLeftY,
                    Page = page,
                    Reason = reason,
                    SignerCertificate = ByteString.CopyFrom(certificate),
                    UpperRightX = upperRightX,
                    UpperRightY = upperRightY,
                };
                var digest = await client.PdfDigestForMultiSignAsync(data);
                return digest;
            }
            else
            {
                throw new BadRequestExceptions();
            }

        }

        public async Task<PutPdfDigestForMultiSignReply> PutPdfDigestForMultiSign(Guid id, byte[] sign, byte[] certificate)
        {
            var result = await client.PutPdfDigestForMultiSignAsync(new PutPdfDigestForMultiSignRequest
            {
                Id=id.ToString(),
                Sign=ByteString.CopyFrom(sign),
                Certificate=ByteString.CopyFrom(certificate)
            });

            return result;
        }
    }
}
