using Share.Application.Common.Cache;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FileManager.GrpcServer.CachedModel
{
    public class FileReplyCached : ICacheKeyGenerator
    {
        public FileReplyCached(Guid[] fileId)
        {
            FileId = fileId;
        }
        public Guid[] FileId { get; init; }
        public FileReply FileReply { get; set; }
        public string GetKey()
        {
            return $"FileReplyCached-{FileId}";    
        }
    }
}
