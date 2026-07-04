//using IdentityServer;
//using IdentityServer.Application.ContextMaps.Users.ForgetPasswords.Command;
//using IdentityServer.Application.ContextMaps.Users.Login.Command;
//using IdentityServer.Application.ContextMaps.Users.Login.Query;
//using IdentityServer.ApplicationPolicy.Services;
//using IdentityServer.Domain;
//using IdentityServer.Domain.Data;
//using IdentityServer.Domain.Entities;
//using IdentityServer4;
//using IdentityServer4.Models;
//using IdentityServer4.Quickstart.UI;
//using IdentityServer4.Services;
//using IdentityServer4.Stores;
//using IdentityServer4.Test;
//using IdentityServerWithAspNetIdentity.Models.AccountViewModels;
//using IdentityServerWithAspNetIdentity.Services;
//using Microsoft.AspNetCore.Authentication;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.AspNetCore.Mvc.Rendering;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.Configuration;
//using Microsoft.Extensions.Logging;
//using Share.Application.Common.Interfaces;
//using Share.Domain.Constants;
//using Share.Domain.Enums;
//using Share.MessageBroker.RabbitMQ.Service;
//using System;
//using System.Linq;
//using System.Net;
//using System.Security.Claims;
//using System.Threading.Tasks;

//namespace IdentityServer.Controllers
//{
//    [ApiExplorerSettings(IgnoreApi = true)]
//    public class UserController : ApiControllerBase
//    {
//        private readonly IConfiguration _configuration;
//        private readonly ICurrentUserService _currentUserService;
//        //  private readonly IChannelProvider _channelProvider;
//        public UserController(
//             IConfiguration configuration, ICurrentUserService currentUserService)
//        {
//            _configuration = configuration;
//            _currentUserService = currentUserService;
//            //    _channelProvider = channelProvider;
//        }


//        [ProducesResponseType((int)HttpStatusCode.OK)]
//        [HttpPost("Login")]
//        public async Task<IActionResult> Login([FromBody] LoginCommand request)
//        {

//            return Ok(await Mediator.Send(request));
//        }

//        [ProducesResponseType((int)HttpStatusCode.OK)]
//        [HttpPost("Login2FA")]
//        public async Task<IActionResult> Login2FA([FromBody] Login2FACommand request)
//        {
//            return Ok(await Mediator.Send(request));
//        }


//        [ProducesResponseType((int)HttpStatusCode.OK)]
//        [HttpPost("ForgetPassword")]
//        public async Task<IActionResult> ForgetPassword([FromBody] ForgetPasswordCommand request)
//        {
//            return Ok(await Mediator.Send(request));
//        }


//        [ProducesResponseType((int)HttpStatusCode.OK)]
//        [HttpPost("ResetPassword")]
//        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand request)
//        {
//            return Ok(await Mediator.Send(request));
//        }




//    }
//}
