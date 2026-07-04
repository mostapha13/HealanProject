using Healan.Application.Appointments.Commands.AppointmentRegister;
using Healan.Application.Appointments.Commands.ChangeAppointmentStatus;
using Healan.Application.Appointments.Queries.AppointmentList;
using Healan.Application.Appointments.Queries.CurrentAppointmentList;
using Healan.Application.Appointments.Queries.GetAppointmentByNationalCode;
using Healan.Application.Appointments.Queries.GetAppointmentInfo;
using Healan.Application.Appointments.Queries.GetAppointmentType;
using Healan.Application.Appointments.Queries.GetInvoice;
using Healan.Application.Appointments.Queries.PaymentMethodTypes;
using Healan.Application.Invoices.Commands.InvoicePay;
using Microsoft.AspNetCore.Mvc;

namespace Healan.WebApi.Controllers;

/// <summary>
/// ویزیت
/// </summary>
public class AppointmentController : ApiControllerBase
{
    [HttpGet("[action]")]
    public async Task<IActionResult> AppointmentList([FromQuery] AppointmentListQuery request) =>
        Ok(await Mediator.Send(request));

    [HttpGet("[action]")]
    public async Task<IActionResult> CurrentAppointmentList([FromQuery] CurrentAppointmentListQuery request) =>
        Ok(await Mediator.Send(request));

    [HttpPost("[action]")]
    public async Task<IActionResult> Register(AppointmentRegisterCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpGet("[action]")]
    public async Task<IActionResult> AppointmentInfo([FromQuery] long appointmentId) =>
        Ok(await Mediator.Send(new GetAppointmentInfoQuery { AppointmentId = appointmentId }));

    [HttpGet("[action]")]
    public async Task<IActionResult> GetAppointmentByNationalCode([FromQuery] string nationalCode) =>
        Ok(await Mediator.Send(new GetAppointmentByNationalCodeQuery { NationalCode = nationalCode }));

    [HttpGet("[action]")]
    public async Task<IActionResult> AppointmentType() =>
        Ok(await Mediator.Send(new GetAppointmentTypeQuery()));

    [HttpGet("[action]")]
    public async Task<IActionResult> GetInvoice([FromQuery] long appointmentId) =>
        Ok(await Mediator.Send(new GetInvoiceQuery { AppointmentId = appointmentId }));

    [HttpPost("[action]")]
    public async Task<IActionResult> InvoicePay(InvoicePayCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpPost("[action]")]
    public async Task<IActionResult> ChangeStatus(ChangeAppointmentStatusCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpGet("[action]")]
    public async Task<IActionResult> GetPaymentMethodTypes() =>
        Ok(await Mediator.Send(new PaymentMethodTypesQuery()));
}
