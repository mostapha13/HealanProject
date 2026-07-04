using Healan.Application.MedicalFeeServices.Commands.MedicalFeeServiceRegister;
using Healan.Application.MedicalFeeServices.Queries.MedicalFeeServiceInfo;
using Healan.Application.MedicalFeeServices.Queries.MedicalFeeServiceList;
using Microsoft.AspNetCore.Mvc;

namespace Healan.WebApi.Controllers;

/// <summary>
/// تعرفه خدمات 
/// </summary>
public class MedicalFeeServicesController : ApiControllerBase
{
    /// <summary>
    /// لیست تعرفه ها
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> List([FromQuery] MedicalFeeServiceListQuery request) =>
                                                                Ok(await Mediator.Send(request));

    /// <summary>
    /// افزودن تعرفه
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public async Task<IActionResult> Register(MedicalFeeServiceRegisterCommand request) =>
                                                                Ok(await Mediator.Send(request));

    /// <summary>
    /// اطلاعات تعرفه
    /// </summary>
    /// <param name="medicalFeeServiceId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> Info([FromQuery] int medicalFeeServiceId) => Ok(await Mediator.Send(new MedicalFeeServiceInfoQuery { MedicalFeeServiceId = medicalFeeServiceId }));




}