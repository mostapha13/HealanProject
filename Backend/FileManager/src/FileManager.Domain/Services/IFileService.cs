using FileManager.Domain.DTOs;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FileManager.Domain.Services
{
    public interface IFileService
    {
        Task<UploadFileResponse> UploadFile(UploadFileRequest request);
        Task<DownloadFileResponse> DownloadFile(Guid fileId, CancellationToken cancellationToken);
        Task<DownloadFilesResponse> DownloadFiles(string fileId, CancellationToken cancellationToken);
    }
}
