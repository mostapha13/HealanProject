

using Healan.WebApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;
using System.Net;
using WorkFlow.Application.ContextMaps.Cardboard.Queries.GetUserCardboard;
using WorkFlow.Application.ContextMaps.Cardboard.Queries.GetUserCardboardRecords;

namespace MarketMaker.WebUI.Controllers
{

    [AccessForm(HealanAccessFormIds.Workflow)]
    public class CardboardController : ApiControllerBase
    {

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("UserCardboard/{lang}")]
        public async Task<IActionResult> UserCardboard([FromQuery] GetUserCardboardQuery userCardboardQuery)
        {
            return Ok(await Mediator.Send(userCardboardQuery));
        }
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("UserCardboardRecord/{lang}")]
        public async Task<IActionResult> UserCardboardRecord([FromQuery] GetUserCardboardRecordQuery userCardboardRecordQuery)
        {
            return Ok(await Mediator.Send(userCardboardRecordQuery));
        }


    }
}