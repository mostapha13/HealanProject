using Share.Domain.Enums;

namespace FileManager.Domain.DTOs
{
    public class UploadFileResponse
    {
        public string Link { get; set; }
        public string FileName { get; set; }
        public string FileId { get; set; }
        public FileTypeId FileType { get; set; }
    }
}
