using Aspose.Words.AI;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Notification.Application.ContextMaps.Command.ReadNotification;
using Notification.Application.ContextMaps.Queries.GetNotifications;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Models;
using Share.MessageBroker.RabbitMQ.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace Notification.WebApp.Controllers
{
    [Route("api/v1/[controller]")]
    public class NotificationController : ApiControllerBase
    {
        private readonly IChannelProvider _channelProvider;
        private readonly IConfiguration _configuration;
        public NotificationController(IChannelProvider channelProvider, IConfiguration configuration)
        {
            _channelProvider = channelProvider;
            _configuration = configuration;
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("NotificationList/{lang}")]
        public async Task<IActionResult> NotificationList([FromQuery] NotificationListQuery request)
        {
            return Ok(await Mediator.Send(request));
        }
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("Read")]
        public async Task<IActionResult> Read([FromQuery] ReadNotificationCommand request)
        {
            return Ok(await Mediator.Send(request));
        }


        [HttpPost("TestRabbitMQConnection")]
        public async Task<IActionResult> TestRabbitMQConnection()
        {
            string configuration = string.Empty;
            try
            {
                var userName = _configuration["RabbitMQ:UserName"];
                var password = _configuration["RabbitMQ:Password"];
                var hostName = _configuration["RabbitMQ:HostName"];
                var port= _configuration["RabbitMQ:Port"];
                configuration = $"configuration \n UserName:{userName} Password:{password} HostName:{hostName} Port:{port}  \n";

                _channelProvider.PublishMessage("Hi", new { Id = 1 }, ("Q1", "R1"));
            }
            catch(Exception ex)
            {
                return BadRequest(configuration+ex.Message);
            }
            return Ok(configuration+"Ok");
        }
    }
}
