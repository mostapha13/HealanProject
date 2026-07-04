using FileManagerClient;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using HashAlgorithmType = Share.Domain.Enums.HashAlgorithmType;

namespace FileManager.GrpcClient.Interfaces
{
    public interface IFileManagerTool
    {
        public Task<List<FileReplyInfo>> GetFileReplyInfos(List<Guid> fileIds);
        public Task<FileReplyInfo> GetFileReplyInfo(Guid fileId);

        public Task<TopPopularFileReply> GetTopPopularFileReplyInfo(int SystemTypeId, int subSystemTypeId, int pageSize);
        public Task<FileSearchReply> SearchFile(int? system, int? subSystem, string FileName, DateTime? from, DateTime? to);

        public Task<ValidateCertificateReply> ValidateCertificateClient(byte[] certificate);
        public Task<PdfDigestForMultiSignReply> PdfDigestForMultiSign(Guid attachmentId, byte[] certificate, string? reason, string? location, string? imageDataUrl, int? page, float? lowerLeftX, float? lowerLeftY, float? upperRightX, float? upperRightY, HashAlgorithmType? hashAlgorithm);

        public Task<PutPdfDigestForMultiSignReply> PutPdfDigestForMultiSign(Guid id, byte[] sign, byte[] certificate);

    }
}
