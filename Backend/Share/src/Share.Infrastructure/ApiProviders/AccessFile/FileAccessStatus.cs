using Microsoft.Extensions.Logging;
using Refit;
using RestSharp;
using Share.Domain.Extensions;
using System.Threading;
using System.Threading.Tasks;


namespace Share.Infrastructure.ApiProviders.AccessFile
{
    public class FileAccessStatus : IFileAccessStatus
    {
        private readonly ILogger<FileAccessStatus> logger;

        public FileAccessStatus(ILogger<FileAccessStatus> logger)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));

        }

        public async Task<bool> HasAccess(string url, Guid fileId, Guid userId)
        {
            try
            {
                HasAccessRequest hasAccessRequest = new HasAccessRequest() { FileId = fileId, UserId = userId };

                var body = hasAccessRequest.ConvertToJson();
                var client = new RestClient(url);
                var request = new RestRequest("", Method.Post);
                request.AddBody(body, "application/json");
                var result = await client.ExecuteAsync<bool>(request);
                return result.Data;
            }
            catch (Exception ex)
            {
                logger.LogCritical(ex, $"Exception Raised in Calling {url}");
                return false;
            }

        }

    }
    public class HasAccessRequest
    {
        public Guid UserId { get; set; }
        public Guid FileId { get; set; }
    }
}
