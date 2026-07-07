using Healan.Application.Doctors.Commands.DoctorRegister;
using Healan.Application.Doctors.Queries.DoctorList;
using Healan.Application.Doctors.Queries.GetDoctorInfo;
using Healan.Application.PublicInfos.Queries.MedicalGroupType;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// پزشک
/// </summary>
[AccessForm(HealanAccessFormIds.Doctors)]
public class DoctorController : ApiControllerBase
{
    /// <summary>
    /// لیست پزشکان
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> DoctorList([FromQuery] DoctorListQuery request) =>
                                                                Ok(await Mediator.Send(request));

    /// <summary>
    /// افزودن پزشک
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public Task<IActionResult> Register([FromBody] DoctorRegisterCommand request) =>
        SendCommand(request);

    /// <summary>
    /// اطلاعات پزشک
    /// </summary>
    /// <param name="doctorId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> DoctorInfo([FromQuery] int doctorId) => Ok(await Mediator.Send(new GetDoctorInfoQuery { DoctorId = doctorId }));

    /// <summary>
    /// گروه پزشکان
    /// </summary>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> MedicalGroupType() => Ok(await Mediator.Send(new MedicalGroupTypeQuery()));


    ///// <summary>
    ///// نوع پزشک
    ///// </summary>
    ///// <param name="doctorId"></param>
    ///// <returns></returns>
    //[HttpGet("[action]")]
    //public async Task<IActionResult> DoctorType() => Ok(await Mediator.Send(new MedicalGroupQuery()));

}