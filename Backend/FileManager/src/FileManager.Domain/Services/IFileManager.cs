using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FileManager.Domain.Services
{
    public interface IFileManager
    {

        Task<string> SaveFile(Stream stream, Guid fileId, string extension,bool isEncypted);
        Stream OpenFile(string savedFileName, bool isEncypted);
        byte[] OpenMultiFile(List<string> savedFileNames);
        string GetMimeType(Stream stream, string fileExtention);
        string GetMimeType(string fileName);
        bool HasCorrectFormat(Stream stream, string fileExtention);
    }
}
