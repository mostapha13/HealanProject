using Share.Domain.Enums;
using System;

#nullable disable

namespace FileManager.Domain.Entities
{
    public class File 
    {
        public Guid Id { get; set; }
        public string Link { get; set; }
        public string Filename { get; set; }
        public string SavedFileName { get; set; }
        public string FileExtension { get; set; }
        public string OriginalFilename { get; set; }
        public double  FileSize { get; set; }
        public bool  IsEncrypted { get; set; }
        public string RequestIP { get; set; }
        public FileTypeId FileTypeId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string JsonInfo { get; set; }
        public long DownloadedCount { get; set; }
        public FileType FileType { get; set; }

    }
}
