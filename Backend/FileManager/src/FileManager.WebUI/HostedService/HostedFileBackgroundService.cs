using FileManager.Domain.Services;
using FileManager.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Share.Domain.Extensions;
using Share.Domain.Messages;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                Console.WriteLine("[FileManager] HostedFileBackgroundService: subscribing RabbitMQ…");
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
                        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                        var file = context.Files.FirstOrDefault(p => p.Id == id);
                        if (file == null)
                            return false;
                        file.JsonInfo = model.ConvertToJson();
                        context.SaveChangesAsync(CancellationToken.None).GetAwaiter().GetResult();
                    }

                    return true;
                },
                (QueueNames.MessageFile, QueueNames.MessageFile));
                Console.WriteLine("[FileManager] HostedFileBackgroundService: RabbitMQ subscribe OK");
            }
            catch (Exception ex)
            {
                // Must not block Kestrel listen / Upload when Rabbit is down.
                Console.Error.WriteLine(
                    $"[FileManager] HostedFileBackgroundService: RabbitMQ subscribe failed (Upload still works): {ex.GetType().Name}: {ex.Message}");
            }

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
