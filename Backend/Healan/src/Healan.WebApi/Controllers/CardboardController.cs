

using Healan.WebApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using WorkFlow.Application.ContextMaps.Cardboard.Queries.GetUserCardboard;
using WorkFlow.Application.ContextMaps.Cardboard.Queries.GetUserCardboardRecords;

namespace MarketMaker.WebUI.Controllers
{

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