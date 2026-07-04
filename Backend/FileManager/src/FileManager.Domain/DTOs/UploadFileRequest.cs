using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FileManager.Domain.DTOs
{
    public class UploadFileRequest
    {
        public Stream Stream { get; set; }
        public string Filename { get; set; }
        public string MimeType { get; set; }
        public long Size { get; set; }
        public bool IsEncrypted { get; set; }
    }

}