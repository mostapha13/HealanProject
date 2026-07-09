using Healan.Application.Doctors.Queries.GetDoctorInfo;
using Healan.Application.Invoices.Commands.PrescriptionRegister;
using Healan.Application.Orders.Queries.EchoReportPrintData;
using Healan.Application.Orders.Queries.GetImageType;
using Healan.Application.Orders.Queries.PrescriptionInfo;
using Healan.Application.Orders.Queries.PrescriptionList;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// نسخه
/// </summary>
[AccessForm(HealanAccessFormIds.Prescriptions)]
public class OrderResultController : ApiControllerBase
{
    /// <summary>
    /// لیست نسخه
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> PrescriptionList([FromQuery] PrescriptionListQuery request) =>
                                                                Ok(await Mediator.Send(request));

    /// <summary>
    /// افزودن نسخه
    /// </summary>
    [HttpPost("[action]")]
    public Task<IActionResult> Register([FromBody] PrescriptionRegisterCommand request) =>
        SendCommand(request);

    /// <summary>
    /// اطلاعات نسخه
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> PrescriptionInfo([FromQuery] int prescriptionId) => Ok(await Mediator.Send(new PrescriptionInfoQuery { PrescriptionId = prescriptionId }));

    /// <summary>
    /// لیست تصویربرداری
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> GetImageType() => Ok(await Mediator.Send(new GetImageTypeQuery()));

    /// <summary>
    /// داده چاپ گزارش اکو برای Stimulsoft
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> EchoReportPrintData([FromQuery] long prescriptionId) =>
        Ok(await Mediator.Send(new EchoReportPrintDataQuery { PrescriptionId = prescriptionId }));
}