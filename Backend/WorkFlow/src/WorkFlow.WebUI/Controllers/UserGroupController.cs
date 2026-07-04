using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Enums;
using Share.Domain.Extensions;
using System.Net;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Command.DeleteGroup;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Command.SaveGroup;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;

namespace WorkFlow.WebUI.Controllers
{

    public class UserGroupController : ApiControllerBase
    {

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("WorkFlowGroupList/{lang}")]
        [AllowAnonymous]
        public async Task<IActionResult> WorkFlowGroupList([FromQuery] WorkFlowGroupListQuery WorkFlowGroupListQuery)
        {
            return Ok(await Mediator.Send(WorkFlowGroupListQuery));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("WorkFlowGroupEnum/{lang}")]
        [AllowAnonymous]
        public async Task<IActionResult> WorkFlowGroupEnum([FromQuery] WorkFlowGroupListQuery WorkFlowGroupListQuery)
        {
            return Ok(EnumExtensions.GetEnumInfo<WorkFlowUserGroupId>());
        }


        //[ProducesResponseType((int)HttpStatusCode.OK)]
        //[HttpGet("MarketMakerUserGroups/{lang}")]
        //public async Task<IActionResult> MarketMakerUserGroups([FromQuery] WorkFlowGroupListQuery WorkFlowGroupListQuery)
        //{
        //    return Ok(await Mediator.Send(WorkFlowGroupListQuery));
        //}

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpDelete("Delete/{WorkFlowUserGroupId}")]
        public async Task<IActionResult> Delete([FromRoute] WorkFlowUserGroupId WorkFlowUserGroupId)
        {
            return Ok(await Mediator.Send(new WorkFlowGroupDeleteCommand() { WorkFlowUserGroupId = WorkFlowUserGroupId }));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("Save")]
        public async Task<IActionResult> Save([FromBody] WorkFlowGroupSaveCommand request)
        {
            return Ok(await Mediator.Send(request));
        }

    }
}