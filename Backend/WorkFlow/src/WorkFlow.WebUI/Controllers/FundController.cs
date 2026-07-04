using Microsoft.AspNetCore.Mvc;
using System.Net;
using WorkFlow.Application.ContextMaps.Funds.Command.DeleteFund;
using WorkFlow.Application.ContextMaps.Funds.Command.SaveFund;
using WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds;

namespace WorkFlow.WebUI.Controllers
{

    public class FundController : ApiControllerBase
    {

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("FundList/{lang}")]
        public async Task<IActionResult> FundList([FromQuery] FundListQuery fundListQuery)
        {
            return Ok(await Mediator.Send(fundListQuery));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("FundAll/{lang}")]
        public async Task<IActionResult> FundAll([FromQuery] FundAllQuery fundListQuery)
        {
            return Ok(await Mediator.Send(fundListQuery));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpDelete("Delete/{fundId}")]
        public async Task<IActionResult> Delete([FromRoute] Guid fundId)
        {
            return Ok(await Mediator.Send(new FundDeleteCommand() { FundId = fundId }));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("Save")]
        public async Task<IActionResult> Save([FromBody] FundSaveCommand request)
        {
            return Ok(await Mediator.Send(request));
        }

    }
}