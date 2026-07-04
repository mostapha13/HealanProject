using System.IO;

namespace FileManager.Domain.DTOs
{
    public class DownloadFileResponse
    {
        public string Filename { get; set; }
        public Stream FileStream { get; set; }
    }
}
