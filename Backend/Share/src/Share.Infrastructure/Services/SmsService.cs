using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Models;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Infrastructure.Services
{
    public class SmsService : ISmsService
    {
        private readonly IChannelProvider _channelProvider;
        ILogger<SmsService> _logger;
        public SmsService(IChannelProvider channelProvider, ILogger<SmsService> logger)
        {
            _channelProvider = channelProvider;
            _logger = logger;
        }
        public async Task<SMSModelResponce> SendSMS(SMSModelRequest sMSModelRequest)
        {
            var traceNumber = Guid.NewGuid().ToString();
            _logger.LogInformation($"Start Publish SMS To Queue: {QueueNames.SMS} With TraceNumber: {traceNumber}");
            _channelProvider.PublishMessage(traceNumber, sMSModelRequest, (QueueNames.SMS, sMSModelRequest.GetType().Name));
            _logger.LogInformation($" SMS Published To Queue: {QueueNames.SMS} With TraceNumber: {traceNumber}");
            return new SMSModelResponce {TraceNumber=traceNumber};
        }
    }
}
