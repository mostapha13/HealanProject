using Microsoft.AspNetCore.Mvc;
using System.Net;
using WorkFlow.Application.ContextMaps.WorkFlowArchives.Queries.GetWorkFlowArchive;

namespace WorkFlow.WebUI.Controllers
{

    public class WorkFlowArchiveController : ApiControllerBase
    {

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("WorkFlowArchive/{lang}")]

        public async Task<IActionResult> WorkFlowArchive([FromQuery] GetWorkFlowArchiveQuery workFlowArchiveQuery)
        {
            return Ok(await Mediator.Send(workFlowArchiveQuery));
        }
    }
}