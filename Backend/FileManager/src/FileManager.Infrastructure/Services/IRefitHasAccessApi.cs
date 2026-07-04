using Refit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FileManager.Infrastructure.Services
{
    public interface IRefitHasAccessApi
    {
        [Post("/MarketMaker/api/v1/File/HasAccess")]
        Task<bool> HasAccess(FileAccessBody body = default);
    }

    public class FileAccessBody 
    {
        public Guid FileId { get; set; }
        public Guid UserId { get; set; }
    }

}
