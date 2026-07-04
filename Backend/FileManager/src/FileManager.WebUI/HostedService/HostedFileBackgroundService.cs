using FileManager.Domain.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Share.Domain.Messages;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using FileManager.Infrastructure.Persistence;
using Share.Domain.Extensions;
namespace FileManager.WebUI.HostedService
{
    public class HostedFileBackgroundService : IHostedService
    {
        private readonly IChannelProvider _channelProvider;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        public HostedFileBackgroundService(IChannelProvider channelProvider, IServiceScopeFactory serviceScopeFactory)
        {
            _channelProvider = channelProvider;
            _serviceScopeFactory = serviceScopeFactory;
            _channelProvider.SubscribeMessage<object>((fileId, model) =>
            {
                if (model == null)
                    return false;
                var fileInfo = model.ConvertToByteArray().ByteArrayToObject<FileInfoMessage>();
                if (fileInfo == null || !fileInfo.FileId.HasValue)
                    return false;
                var id = fileId.ToGuid();
                if (!id.HasValue)
                    return false;
                using (var scope = _serviceScopeFactory.CreateScope())
                {
                    var _context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

                    //var qq = from c in _context.Files
                    //         select new { ssss = ApplicationDbContext.JsonValue(c.JsonInfo, "$.Name") };

                    //var jjj = qq.ToList();


                    var file = _context.Files.FirstOrDefault(p => p.Id == id);
                    if (file == null)
                        return false;
                    file.JsonInfo = model.ConvertToJson();
                    _context.SaveChangesAsync(CancellationToken.None).GetAwaiter().GetResult();
                }

                return true;
            },
            (QueueNames.MessageFile, QueueNames.MessageFile));

        }
        public Task StartAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
