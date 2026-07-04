using Refit;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Login;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Validate;
using System;
using System.Threading;
using System.Threading.Tasks;


namespace Share.Infrastructure.ApiProviders.AccessFile
{
    public interface IFileAccessStatus
    {
        Task<bool> HasAccess(string url, Guid fileId, Guid userId);
    }


}