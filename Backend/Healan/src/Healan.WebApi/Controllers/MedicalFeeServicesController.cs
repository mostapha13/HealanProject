using Healan.Application.Common.MasterData;
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

    [HttpGet("[action]")]
    public async Task<IActionResult> DeletedList() =>
        Ok(await Mediator.Send(new MasterDataDeletedListQuery { Type = MasterDataType.MedicalFeeService }));

    [HttpPost("[action]")]
    public async Task<IActionResult> Delete([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataDeleteCommand { Type = MasterDataType.MedicalFeeService, Id = request.Id }));

    [HttpPost("[action]")]
    public async Task<IActionResult> Restore([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataRestoreCommand { Type = MasterDataType.MedicalFeeService, Id = request.Id }));

    /// <summary>
    /// اطلاعات تعرفه
    /// </summary>
    /// <param name="medicalFeeServiceId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> Info([FromQuery] int medicalFeeServiceId) => Ok(await Mediator.Send(new MedicalFeeServiceInfoQuery { MedicalFeeServiceId = medicalFeeServiceId }));




}