using Healan.Application.Doctors.Queries.GetDoctorInfo;
using Healan.Application.Invoices.Commands.PrescriptionRegister;
using Healan.Application.Orders.Queries.GetImageType;
using Healan.Application.Orders.Queries.PrescriptionInfo;
using Healan.Application.Orders.Queries.PrescriptionList;
using Microsoft.AspNetCore.Mvc;

namespace Healan.WebApi.Controllers;

/// <summary>
/// نسخه
/// </summary>
public class OrderResultController : ApiControllerBase
{
    /// <summary>
    /// لیست نسخه
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> PrescriptionList([FromQuery] PrescriptionListQuery request) =>
                                                                Ok(await Mediator.Send(request));

    /// <summary>
    /// افزودن نسخه
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public async Task<IActionResult> Register(PrescriptionRegisterCommand request) =>
                                                                Ok(await Mediator.Send(request));

    /// <summary>
    /// اطلاعات نسخه
    /// </summary>
    /// <param name="prescriptionId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> PrescriptionInfo([FromQuery] int prescriptionId) => Ok(await Mediator.Send(new PrescriptionInfoQuery { PrescriptionId = prescriptionId }));



    /// <summary>
    /// لیست تصویربرداری
    /// </summary>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> GetImageType() => Ok(await Mediator.Send(new GetImageTypeQuery()));

    
}