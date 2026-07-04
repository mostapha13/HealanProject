using FileManager.Domain.DTOs;
using System.Collections.Generic;

namespace FileManager.Domain.Configs
{
    public class UploadFileConfig
    {
        public string DirectoryPath { get; set; }
        public IEnumerable<UploadFileProfile> Profiles { get; set; }
    }


}
