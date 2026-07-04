
using Microsoft.AspNetCore.Mvc;
using System.Net;
using WorkFlow.Application.ContextMaps.Archives.Queries.GetUserArchives;

namespace WorkFlow.WebUI.Controllers
{

    public class ArchiveController : ApiControllerBase
    {

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("UserArchive/{lang}")]
        public async Task<IActionResult> UserArchive([FromQuery] GetUserArchivesQuery getUserCardboardArchivesQuery)
        {
            return Ok(await Mediator.Send(getUserCardboardArchivesQuery));
        }

    }
}