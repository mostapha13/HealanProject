using IdentityServer.Application.ContextMaps.AminPanel.Commands;
using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessForm;
using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessMenu;
using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessRole;
using IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessUserRole;
using IdentityServer.Application.ContextMaps.AminPanel.Queries.Role;
using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Share.Application.Common.Interfaces;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;
using System.Net;


namespace IdentityServer.UserManagerAPI.Controllers
{
    [ApiExplorerSettings(IgnoreApi = false)]
    //[Authorize]
    public class UserAccessController : ApiControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<UserAccessController> _logger;
        //  private readonly IChannelProvider _channelProvider;
        public UserAccessController(
             IConfiguration configuration, ICurrentUserService currentUserService, ILogger<UserAccessController> logger)
        {
            _configuration = configuration;
            _currentUserService = currentUserService;
            _logger = logger;
            //    _channelProvider = channelProvider;
        }

        /// <summary>
        /// Roles
        /// </summary>
        /// <param name="roleQuery"></param>
        /// <returns></returns>
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("Role/{lang}")]
        [AccessForm(61, 2104, 14, 2102, HealanAccessFormIds.AccessAdmin, HealanAccessFormIds.AccessDefine, HealanAccessFormIds.AccessRoleAssign)]
        public async Task<IActionResult> Role([FromQuery] RoleQuery roleQuery)
        {
            return Ok(await Mediator.Send(roleQuery));
        }

        /// <summary>
        /// --------------------
        /// </summary>
        /// <param name="listAccessFormQuery"></param>
        /// <returns></returns>
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("AccessForm/{lang}")]
        [AccessForm(61, 2104, HealanAccessFormIds.AccessAdmin, HealanAccessFormIds.AccessDefine)]
        public async Task<IActionResult> AccessForm([FromQuery] ListAccessFormQuery listAccessFormQuery)
        {
            return Ok(await Mediator.Send(listAccessFormQuery));
        }
        /// <summary>
        /// All Menu______
        /// </summary>
        /// <param name="listAccessMenuQuery"></param>
        /// <returns></returns>
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("AccessMenu/{lang}")]
        [AccessForm(61, 2104, HealanAccessFormIds.AccessAdmin, HealanAccessFormIds.AccessDefine)]
        public async Task<IActionResult> AccessMenu([FromQuery] ListAccessMenuQuery listAccessMenuQuery)
        {
            return Ok(await Mediator.Send(listAccessMenuQuery));
        }
        /// <summary>
        /// Main Access Section For Show Menu+Accessed Item 
        /// </summary>
        /// <param name="listAccessRoleQuery"></param>
        /// <returns></returns>
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("AccessRole/{lang}")]
        [AccessForm(61, 2104, HealanAccessFormIds.AccessAdmin, HealanAccessFormIds.AccessDefine, HealanAccessFormIds.AccessRoleAssign)]
        public async Task<IActionResult> AccessRole([FromQuery] ListAccessRoleQuery listAccessRoleQuery)
        {
            return Ok(await Mediator.Send(listAccessRoleQuery));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("SaveAccessRole")]
        [AccessForm(61, 2104, HealanAccessFormIds.AccessAdmin, HealanAccessFormIds.AccessRoleAssign)]
        public async Task<IActionResult> SaveAccessRole([FromBody] SaveAccessRoleCommand saveAccessRoleCommand)
        {
            return Ok(await Mediator.Send(saveAccessRoleCommand));
        }

        /// <summary>
        ///  Get Every Time Windows Refreshed For Show Menu 
        /// </summary>
        /// <param name="listAccessUserRoleQuery"></param>
        /// <returns></returns>
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("UserAccessRole")]
        public async Task<IActionResult> UserAccessRole([FromQuery] ListAccessUserRoleQuery listAccessUserRoleQuery)
        {
            return Ok(await Mediator.Send(listAccessUserRoleQuery));

        }

    }
}
