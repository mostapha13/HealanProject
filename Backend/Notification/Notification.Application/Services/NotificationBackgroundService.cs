using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Notification.Application.Domain.Entities;
using Notification.Application.Interface;
using Share.Domain.Entities;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;

namespace Notification.Application.Services
{
    public class NotificationBackgroundService : BackgroundService
    {
        private readonly IChannelProvider _channelProvider;
        private readonly ILogger<NotificationBackgroundService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        public NotificationBackgroundService(IChannelProvider channelProvider, ILogger<NotificationBackgroundService> logger, IServiceScopeFactory serviceScopeFactory)
        {
            _channelProvider = channelProvider;
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected async override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Factory.StartNew(() =>
             SubscribeNotification<NotificationInfoMessage>((model) =>
             {
                 try
                 {
                     using (var scope = _serviceScopeFactory.CreateScope())
                     {
                         var _applicationDbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                         var notification = _applicationDbContext.NotificationInfos.FirstOrDefault(p => p.NotificationInfoId == model.NotificationInfoId);
                         if (notification == null)
                         {
                             notification = new NotificationInfo();
                             _applicationDbContext.NotificationInfos.Add(notification);
                         }
                         if (model.Instrument != null)
                             notification.Instrument = new InstrumentInfo()
                             {
                                 CompanyName = model.Instrument.CompanyName,
                                 Investment = model.Instrument.Investment,
                                 MarketTypeId = model.Instrument.MarketTypeId,
                                 Symbol = model.Instrument.Symbol,
                                 SymbolCode = model.Instrument.SymbolCode,
                                 SymbolName = model.Instrument.SymbolName
                             };
                         notification.AccessSystemId = model.AccessSystemId;
                         notification.InstrumentId = model.InstrumentId;
                         notification.OrderId = model.OrderId;
                         notification.Creator = model.Creator;
                         notification.MessageText = model.MessageText;
                         notification.ExtraInfo = model.ExtraInfo;
                         notification.Notif_Date = DateTime.Now;
                         foreach (var item in model.NotificationUsers)
                         {
                             notification.NotificationUsers.Add(new NotificationUser()
                             {
                                 UserId = item.UserId,

                             });

                         }
                         _applicationDbContext.SaveChangesAsync(CancellationToken.None).GetAwaiter().GetResult();
                         return true;
                     }

                 }
                 catch (Exception ex)
                 {
                     _logger.LogError(ex, "Error In Save Notification....");
                     return false;
                 }
             }), TaskCreationOptions.LongRunning);
        }

        private bool IsValid(NotificationInfoMessage model, string MessageId)
        {
            if (model == null || model.NotificationUsers == null || model.NotificationUsers.Count == 0)
            {
                _logger.LogError($"Message with Id {MessageId} has no Notification");
                return false;
            }
            if (string.IsNullOrEmpty(model.MessageText))
            {
                _logger.LogError($"MessageText With Id {MessageId} is empty");
                return false;
            }
            return true;
        }
        private void SubscribeNotification<T>(Func<T, bool> callback) where T : NotificationInfoMessage
        {
            try
            {
                _channelProvider.SubscribeMessage<T>((messageId, model) =>
                {
                    _logger.LogInformation($"Get Notification From Quey: {QueueNames.Notification} With TraceNumber: {messageId}");
                    if (!IsValid(model, messageId))
                        return false;
                    return callback(model);

                }, (QueueNames.Notification, typeof(T).Name));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error In SubscribeNotification....");
            }
        }

    }
}
