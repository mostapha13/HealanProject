using System.IO;

namespace FileManager.Domain.DTOs
{
    public class DownloadFilesResponse
    {
        public string Filename { get; set; }
        public byte[] ByteArray { get; set; }
    }
}
