using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Enums;
using Share.Domain.Extensions;
using System.Net;
using WorkFlow.Application.ContextMaps.Forms.Command.CheckIsOrderInCardbord;
using WorkFlow.Application.ContextMaps.Forms.Command.CloseForm;
using WorkFlow.Application.ContextMaps.Forms.Command.ConditionalConfirmForm;
using WorkFlow.Application.ContextMaps.Forms.Command.ConfirmForm;
using WorkFlow.Application.ContextMaps.Forms.Command.DenyForm;
using WorkFlow.Application.ContextMaps.Forms.Command.RejectForm;
using WorkFlow.Application.ContextMaps.Forms.Queries.GetFormByFormId;
using WorkFlow.Application.ContextMaps.Forms.Queries.GetForms;

namespace WorkFlow.WebUI.Controllers
{

    public class FormsController : ApiControllerBase
    {

        [HttpGet("Forms")]
        [AllowAnonymous]
        public async Task<IActionResult> Forms()
        {
            return Ok(EnumExtensions.GetEnumInfo<FormId>());
        }

        [HttpGet("GetFormByFormId/{lang}")]
        public async Task<IActionResult> GetFormByFormId(GetFormByFormIdQuery request = default)
        {
            return Ok(await Mediator.Send(request));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("OrderDetailFormById/{lang}")]
        public async Task<IActionResult> OrderDetailFormById([FromQuery] GetOrderDetailFormById request)
        {
            return Ok(await Mediator.Send(request));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("OrderWorkFlowById/{lang}")]
        public async Task<IActionResult> OrderWorkFlowById([FromQuery] GetOrderWorkFlowById request)
        {
            return Ok(await Mediator.Send(request));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("ConfirmForm")]
        public async Task<IActionResult> ConfirmForm([FromBody] ConfirmFormCommand request)
        {
            return Ok(await Mediator.Send(request));
        }
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("ConditionalConfirmForm")]
        public async Task<IActionResult> ConditionalConfirmForm([FromBody] ConditionalConfirmFormCommand request)
        {
            return Ok(await Mediator.Send(request));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("RejectForm")]
        public async Task<IActionResult> RejectForm([FromBody] RejectFormCommand request)
        {
            return Ok(await Mediator.Send(request));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("DenyForm")]
        public async Task<IActionResult> DenyForm([FromBody] DenyFormCommand request)
        {
            return Ok(await Mediator.Send(request));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("CloseForm")]
        public async Task<IActionResult> CloseForm([FromBody] CloseFormCommand request)
        {
            return Ok(await Mediator.Send(request));
        }



        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("IsOrderInCardbord")]
        public async Task<IActionResult> IsOrderInCardbord([FromBody] IsOrderInCardbord request)
        {
            return Ok(await Mediator.Send(request));
        }
    }
}