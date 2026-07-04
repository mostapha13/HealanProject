using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Enums;
using Share.Domain.Extensions;
using System.Net;
using WorkFlow.Application.ContextMaps.Orders.Command.ObservedOrder;
using WorkFlow.Application.ContextMaps.Orders.Command.SaveDraftOrder;
using WorkFlow.Application.ContextMaps.Orders.Command.SaveOrder;
using WorkFlow.Application.ContextMaps.Orders.Command.UpdateExtraInfo;
using WorkFlow.Application.ContextMaps.Orders.Command.UpdateOrderStatusByGuideId;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrderDraftByUserId;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders;

namespace WorkFlow.WebUI.Controllers
{

    public class OrderController : ApiControllerBase
    {

        [HttpGet("WorkFlowType")]
        [AllowAnonymous]
        public async Task<IActionResult> WorkFlowType()
        {
            return Ok(EnumExtensions.GetEnumInfo<WorkFlowTypeId>());
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("OrderList/{lang}")]
        public async Task<IActionResult> OrderList([FromQuery] OrderListQuery OrderListQuery)
        {
            return Ok(await Mediator.Send(OrderListQuery));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("GetOrderDraftByUserId/{lang}")]
        public async Task<IActionResult> GetOrderDraftByUserId([FromQuery] GetOrderDraftByUserIdQuery request)
        {
            return Ok(await Mediator.Send(request));
        }


        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpGet("GetOrder/{lang}")]
        public async Task<IActionResult> GetOrder([FromQuery] GetOrderQuery request)
        {
            return Ok(await Mediator.Send(request));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("Submit")]
        public async Task<IActionResult> Save([FromBody] OrderSaveCommand request)
        {
            return Ok(await Mediator.Send(request));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("SubmitDraft")]
        public async Task<IActionResult> SaveDraft([FromBody] SaveDraftOrderCommand request)
        {
            return Ok(await Mediator.Send(request));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("UpdateExtraInfo")]
        public async Task<IActionResult> UpdateExtraInfo([FromBody] UpdateExtraInfoCommand request)
        {
            return Ok(await Mediator.Send(request));
        }



        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("ObservedOrder")]
        public async Task<IActionResult> ObservedOrder([FromBody] ObservedOrderCommand request)
        {
            return Ok(await Mediator.Send(request));
        }

        [ProducesResponseType((int)HttpStatusCode.OK)]
        [HttpPost("UpdateOrderStatusByGuideId")]
        public async Task<IActionResult> UpdateOrderStatusByGuideId([FromBody] UpdateOrderStatusByGuideIdCommand request)
        {
            return Ok(await Mediator.Send(request));
        }


    }
}