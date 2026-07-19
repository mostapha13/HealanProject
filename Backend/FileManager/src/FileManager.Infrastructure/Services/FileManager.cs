using FileManager.Domain.Configs;
using FileManager.Domain.Services;
using Ionic.Zip;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeDetective.InMemory;
using Share.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FileManager.Infrastructure.Services
{
    public class FileManagerSerive : IFileManager
    {
        private readonly ILogger<FileManagerSerive> logger;
        private readonly UploadFileConfig _config;
        private readonly ILinkMaker _linkMaker;
        private readonly string filePassword = "ijfyth36Q343!jfg$dhf?D_*";
        public FileManagerSerive(ILogger<FileManagerSerive> logger,
            IOptionsMonitor<UploadFileConfig> config, ILinkMaker linkMaker)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this._config = config?.CurrentValue ?? throw new ArgumentNullException(nameof(config));
            _linkMaker = linkMaker;
        }

        public async Task<string> SaveFile(Stream stream, Guid fileId, string extension, bool isEncypted)
        {
            var directory = string.IsNullOrWhiteSpace(_config.DirectoryPath) ? "Attachment" : _config.DirectoryPath;
            Directory.CreateDirectory(directory);

            if (!isEncypted)
                return await CopyStreamToFile(fileId, directory, extension, stream);
            else
                return await CopyStreamToEncryptedFile(fileId, directory, extension, stream);

        }
        private async Task<string> CopyStreamToFile(Guid fileId, string directory, string extension, Stream input)
        {
            var newFileName = fileId + extension;
            var newfilePath = Path.Combine(directory, newFileName);
            using (var fileStream = new FileStream(newfilePath, FileMode.Create))
            {
                byte[] buffer = new byte[8 * 1024];
                int len;
                input.Position = 0;
                while ((len = input.Read(buffer, 0, buffer.Length)) > 0)
                {
                    fileStream.Write(buffer, 0, len);
                }
            }
            return newFileName;
        }
        private async Task<string> CopyStreamToEncryptedFile(Guid fileId, string directory, string extension, Stream input)
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            var fileName = fileId + extension;
            var encryptedFileName = fileId + ".zip";
            var newfilePath = Path.Combine(directory, encryptedFileName);
            using (var fileStream = new FileStream(newfilePath, FileMode.Create))
            {
                using (var s = new ZipOutputStream(fileStream))
                {
                    s.Password = filePassword;
                    s.PutNextEntry(fileName);

                    using (var memoryStream = new MemoryStream())
                    {
                        await input.CopyToAsync(memoryStream);
                        byte[] buffer = memoryStream.ToArray();
                        s.Write(buffer, 0, buffer.Length);
                    }
                }
            }
            return encryptedFileName;
        }


        public Stream OpenFile(string savedFileName, bool isEncypted)
        {
            var directory = string.IsNullOrWhiteSpace(_config.DirectoryPath) ? "Attachment" : _config.DirectoryPath;
            // SavedFileName may already be a full path (encrypted uploads).
            var filePath = Path.IsPathRooted(savedFileName)
                ? savedFileName
                : Path.Combine(directory, Path.GetFileName(savedFileName));

            if (!File.Exists(filePath))
                throw new NotFoundExceptions("فایل مورد نظر پیدا نشد");
            if (!isEncypted)
                return OpenFile(filePath);
            else
                return OpenEncryptedFile(filePath);
        }
        private Stream OpenFile(string filePath)
        {
            FileStream stream = File.OpenRead(filePath);
            return stream;
        }
        private Stream OpenEncryptedFile(string filePath)
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            using (ZipFile archive = ZipFile.Read(filePath))  //<== Crash Here!
            {
                foreach (ZipEntry entry in archive.Entries)
                {
                    System.IO.MemoryStream memoryStream = new MemoryStream();
                    entry.ExtractWithPassword(memoryStream, filePassword);
                    memoryStream.Position = 0;
                    return memoryStream;
                }
            }
            return null;
        }


        public string GetMimeType(Stream stream, string fileExtention)
        {
            var meme = MimeDetective.InMemory.MimeExtensions.DetectMimeType(stream);
            if (meme == null)
            {
                return getMimeFromStream(stream, fileExtention);
            }
            return meme.Mime;
        }
        public string GetMimeType(string fileName)
        {
            return MimeTypes.GetMimeType(fileName);
        }
        public bool HasCorrectFormat(Stream stream, string fileExtention)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                stream.CopyTo(ms);
                ms.Position = 0;
                var mimeType = GetMimeType(ms, fileExtention);
                return MimeMapping.MimeUtility.TypeMap.Any(a => a.Key == fileExtention.Replace(".", "") && a.Value == mimeType);
            }
        }

        [DllImport("urlmon.dll", CharSet = CharSet.Unicode, ExactSpelling = true, SetLastError = false)]
        static extern int FindMimeFromData(IntPtr pBC,
         [MarshalAs(UnmanagedType.LPWStr)] string pwzUrl,
        [MarshalAs(UnmanagedType.LPArray, ArraySubType=UnmanagedType.I1, SizeParamIndex=3)]
        byte[] pBuffer,
         int cbSize,
            [MarshalAs(UnmanagedType.LPWStr)] string pwzMimeProposed,
         int dwMimeFlags,
         out IntPtr ppwzMimeOut,
         int dwReserved);
        public static string getMimeFromStream(Stream stream, string fileExtention)
        {
            IntPtr mimeout;
            byte[] buffer = new byte[256];
            if (stream.Length >= 256)
                stream.Read(buffer, 0, 256);
            else
                stream.Read(buffer, 0, (int)stream.Length);
            int result = FindMimeFromData(IntPtr.Zero, fileExtention, buffer, buffer.Length, null, 0, out mimeout, 0);

            if (result != 0)
                throw Marshal.GetExceptionForHR(result);
            string mime = Marshal.PtrToStringUni(mimeout);
            Marshal.FreeCoTaskMem(mimeout);
            return mime;
        }

        public byte[] OpenMultiFile(List<string> savedFileNames)
        {
            var directory = _config.DirectoryPath;
            using (ZipFile zip = new ZipFile())
            {
                zip.AlternateEncodingUsage = ZipOption.AsNecessary;
                zip.AddDirectoryByName("Files");
                foreach (var file in savedFileNames)
                {
                    var filePath = Path.Combine(directory, file);
                    if (File.Exists(filePath))
                    {
                        zip.AddFile(filePath, "Files");
                    }
                }
                string zipName = String.Format("Zip_{0}.zip", DateTime.Now.ToString("yyyy-MMM-dd-HHmmss"));
                using (MemoryStream memoryStream = new MemoryStream())
                {
                    zip.Save(memoryStream);
                    return memoryStream.ToArray();
                }
            }
        }
    }
}
