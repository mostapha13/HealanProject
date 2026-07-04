using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FileManager.Infrastructure.Extensions
{
    public static class FileExtensions
    {
        public static async Task<string> ToBase64Async(this IFormFile file)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();
            return Convert.ToBase64String(fileBytes);
        }

        public static async Task<byte[]> ToByteAsync(this IFormFile file)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();
            return fileBytes;
        }

        public static async Task<string> ToBase64Async(this byte[] file)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));
            return Convert.ToBase64String(file);
        }
    }
}
