using Microsoft.AspNetCore.Mvc;
using Share.Application.Common.Interfaces;
using System.Net;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.SaveUser;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetWorkflowUserByUserId;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetWorkflowUserByUserIds;

namespace WorkFlow.WebUI.Controllers
{

    public class UserController : ApiControllerBase
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<UserController> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public UserController(ICurrentUserService currentUserService, ILogger<UserController> logger, IHttpContextAccessor httpContextAccessor)
        {
            _currentUserService = currentUserService;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("WorkFlowUserList/{lang}")]
        public async Task<IActionResult> WorkFlowUserList([FromQuery] WorkFlowUserListQuery WorkFlowUserListQuery)
        {
            return Ok(await Mediator.Send(WorkFlowUserListQuery));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("WorkFlowUserAll/{lang}")]
        public async Task<IActionResult> WorkFlowUserAll([FromQuery] WorkFlowUserAllQuery workFlowUserAllQuery)
        {
            return Ok(await Mediator.Send(workFlowUserAllQuery));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("WorkflowUserByUserId/{lang}")]
        public async Task<IActionResult> WorkflowUserByUserId([FromQuery] GetWorkflowUserByUserIdQuery WorkFlowUserByUserIdQuery)
        {
            return Ok(await Mediator.Send(WorkFlowUserByUserIdQuery));
        }
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("WorkflowUserByUserIds/{lang}")]
        public async Task<IActionResult> WorkflowUserByUserIds([FromQuery] GetWorkflowUserByUserIdsQuery request)
        {
            return Ok(await Mediator.Send(request));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("Save")]
        public async Task<IActionResult> Save([FromBody] WorkFlowUserSaveCommand request)
        {
            return Ok(await Mediator.Send(request));
        }

    }
}