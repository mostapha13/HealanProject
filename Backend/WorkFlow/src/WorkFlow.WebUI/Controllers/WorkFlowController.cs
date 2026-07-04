using Microsoft.AspNetCore.Mvc;
using System.Net;
using WorkFlow.Application.ContextMaps.WorkFlow.Query.GetWorkFlowById;

namespace WorkFlow.WebUI.Controllers
{

    public class WorkFlowController : ApiControllerBase
    {

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("WorkFlowById/{lang}")]

        public async Task<IActionResult> WorkFlowArchive([FromQuery] WorkFlowByIdQuery workFlowByIdQuery)
        {
            return Ok(await Mediator.Send(workFlowByIdQuery));
        }

    }
}