using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FileManager.Domain.DTOs
{
    public class UploadFileProfile
    {
        public IEnumerable<string> Extension { get; set; }
        public FileTypeId Type { get; set; }
        public long MaxSizeKB { get; set; }
        public long MinSizeKB { get; set; }
        public string Directory { get; set; }
    }
}
