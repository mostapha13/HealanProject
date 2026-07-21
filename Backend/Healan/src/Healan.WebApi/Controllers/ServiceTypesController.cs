using Healan.Application.Common.MasterData;
using Healan.Application.PublicInfos.Queries.CategoryType;
using Healan.Application.ServiceTypes.Commands.ServiceTypeDelete;
using Healan.Application.ServiceTypes.Commands.ServiceTypeRegister;
using Healan.Application.ServiceTypes.Queries.ServiceTypeInfo;
using Healan.Application.ServiceTypes.Queries.ServiceTypeList;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// نوع خدمات 
/// </summary>
[AccessForm(HealanAccessFormIds.Services)]
public class ServiceTypesController : ApiControllerBase
{

    /// <summary>
    /// لیست خدمات
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> List([FromQuery] ServiceTypeListQuery request) =>
                                                                
        Ok(await Mediator.Send(request));

    /// <summary>
    /// افزودن خدمت
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public Task<IActionResult> Register([FromBody] ServiceTypeRegisterCommand request) =>
        SendCommand(request);

    /// <summary>
    /// حذف خدمت
    /// </summary>
    [HttpPost("[action]")]
    public Task<IActionResult> Delete([FromBody] ServiceTypeDeleteCommand request) =>
        SendCommand(request);

    [HttpGet("[action]")]
    public async Task<IActionResult> DeletedList() =>
        Ok(await Mediator.Send(new MasterDataDeletedListQuery { Type = MasterDataType.ServiceType }));

    [HttpPost("[action]")]
    public async Task<IActionResult> Restore([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataRestoreCommand { Type = MasterDataType.ServiceType, Id = request.Id }));

    /// <summary>
    /// اطلاعات خدمت
    /// </summary>
    /// <param name="serviceTypeId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> Info([FromQuery] int serviceTypeId) => Ok(await Mediator.Send(new ServiceTypeInfoQuery { ServiceTypeId = serviceTypeId }));


    /// <summary>
    /// نوع خدمات
    /// </summary>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> CategoryType() => Ok(await Mediator.Send(new CategoryTypeQuery()));


}