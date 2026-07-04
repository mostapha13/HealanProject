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
    public class EmailService : IEmailService
    {
        private readonly IChannelProvider _channelProvider;
        ILogger<EmailService> _logger;
        public EmailService(IChannelProvider channelProvider, ILogger<EmailService> logger)
        {
            _channelProvider = channelProvider;
            _logger = logger;
        }
        public async Task<EmailModelResponce> SendEmail(EmailModelRequest EmailModelRequest)
        {
            var traceNumber = Guid.NewGuid().ToString();
            _logger.LogInformation($"Start Publish Email To Queue: {QueueNames.Email} With TraceNumber: {traceNumber}");
            _channelProvider.PublishMessage(traceNumber, EmailModelRequest, (QueueNames.Email, EmailModelRequest.GetType().Name));
            _logger.LogInformation($" Email Published To Queue: {QueueNames.Email} With TraceNumber: {traceNumber}");
            return new EmailModelResponce {TraceNumber=traceNumber};
        }
    }
}
