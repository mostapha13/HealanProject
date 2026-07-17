using Healan.Application.Booking.Commands.BookingMutations;
using Healan.Application.Booking.Commands.ScheduleTemplateCopy;
using Healan.Application.Booking.Commands.ScheduleTemplateDelete;
using Healan.Application.Booking.Commands.ScheduleTemplateSave;
using Healan.Application.Booking.Queries;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

[AccessForm(HealanAccessFormIds.BookingSchedules)]
public class BookingScheduleController : ApiControllerBase
{
    [HttpGet("[action]")]
    public async Task<IActionResult> TemplateList([FromQuery] long? doctorId) =>
        Ok(await Mediator.Send(new ScheduleTemplateListQuery { DoctorId = doctorId }));

    [HttpPost("[action]")]
    public Task<IActionResult> TemplateSave([FromBody] ScheduleTemplateSaveCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    public Task<IActionResult> TemplateDelete([FromBody] ScheduleTemplateDeleteCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    public Task<IActionResult> TemplateCopy([FromBody] ScheduleTemplateCopyCommand request) =>
        SendCommand(request);

    [HttpGet("[action]")]
    public async Task<IActionResult> ExceptionList([FromQuery] ScheduleExceptionListQuery query) =>
        Ok(await Mediator.Send(query));

    [HttpPost("[action]")]
    public Task<IActionResult> ExceptionSave([FromBody] ScheduleExceptionSaveCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    public Task<IActionResult> GenerateSlots([FromBody] ScheduleGenerateSlotsCommand request) =>
        SendCommand(request);

    [HttpGet("[action]")]
    public async Task<IActionResult> SlotList([FromQuery] AppointmentSlotListQuery query) =>
        Ok(await Mediator.Send(query));

    [HttpPost("[action]")]
    public Task<IActionResult> SlotBlock([FromBody] SlotBlockCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    public Task<IActionResult> SlotManualCreate([FromBody] SlotManualCreateCommand request) =>
        SendCommand(request);
}

[AccessForm(HealanAccessFormIds.BookingReservations, HealanAccessFormIds.BookingSchedules)]
public class BookingReservationController : ApiControllerBase
{
    [HttpGet("[action]")]
    public async Task<IActionResult> List([FromQuery] AppointmentBookingListQuery query) =>
        Ok(await Mediator.Send(query));

    [HttpPost("[action]")]
    public Task<IActionResult> Create([FromBody] BookingCreateCommand request)
    {
        request.BookedByStaff = true;
        return SendCommand(request);
    }

    [HttpPost("[action]")]
    public Task<IActionResult> Cancel([FromBody] BookingCancelCommand request)
    {
        request.ByStaff = true;
        return SendCommand(request);
    }

    [HttpPost("[action]")]
    public Task<IActionResult> Move([FromBody] BookingMoveCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    public Task<IActionResult> UpdateNote([FromBody] BookingUpdateNoteCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    public Task<IActionResult> Accept([FromBody] BookingAcceptCommand request) =>
        SendCommand(request);
}
