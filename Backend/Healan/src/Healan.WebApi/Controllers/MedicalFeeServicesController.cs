using Healan.Application.MedicalFeeServices.Commands.MedicalFeeServiceRegister;
using Healan.Application.MedicalFeeServices.Queries.MedicalFeeServiceInfo;
using Healan.Application.MedicalFeeServices.Queries.MedicalFeeServiceList;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// تعرفه خدمات 
/// </summary>
[AccessForm(HealanAccessFormIds.MedicalFees)]
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
    public Task<IActionResult> Register([FromBody] MedicalFeeServiceRegisterCommand request) =>
        SendCommand(request);

    /// <summary>
    /// اطلاعات تعرفه
    /// </summary>
    /// <param name="medicalFeeServiceId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> Info([FromQuery] int medicalFeeServiceId) => Ok(await Mediator.Send(new MedicalFeeServiceInfoQuery { MedicalFeeServiceId = medicalFeeServiceId }));




}