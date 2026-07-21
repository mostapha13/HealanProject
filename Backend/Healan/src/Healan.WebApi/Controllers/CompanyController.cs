using Healan.Application.Common.MasterData;
using Healan.Application.Companies.Commands.CompanyRegister;
using Healan.Application.Companies.Queries.CompanyList;
using Healan.Application.Companies.Queries.CompanyRegistrationTypes;
using Healan.Application.Companies.Queries.GetCompanyInfo;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;
[AccessForm(HealanAccessFormIds.Companies)]
public class CompanyController : ApiControllerBase
{
    /// <summary>
    /// لیست شرکت ها
    /// </summary>
    /// <param name="companyList"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> CompanyList([FromQuery] CompanyListQuery companyList) =>
                                                                Ok(await Mediator.Send(companyList));

    /// <summary>
    /// افزودن شرکت
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public Task<IActionResult> Register([FromBody] CompanyRegisterCommand request) =>
        SendCommand(request);

    [HttpGet("[action]")]
    public async Task<IActionResult> DeletedList() =>
        Ok(await Mediator.Send(new MasterDataDeletedListQuery { Type = MasterDataType.Company }));

    [HttpPost("[action]")]
    public async Task<IActionResult> Delete([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataDeleteCommand { Type = MasterDataType.Company, Id = request.Id }));

    [HttpPost("[action]")]
    public async Task<IActionResult> Restore([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataRestoreCommand { Type = MasterDataType.Company, Id = request.Id }));

    /// <summary>
    /// اطلاعات شرکت
    /// </summary>
    /// <param name="companyId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> CompanyInfo([FromQuery] int companyId) => Ok(await Mediator.Send(new GetCompanyInfoQuery { CompanyId = companyId }));

    /// <summary>
    /// گرفتن انواع شرکتهای ثبتی مثل سهامی خاص یا سهامی عام
    /// </summary>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> CompanyRegistrationTypes() =>
                                                                Ok(await Mediator.Send(new CompanyRegistrationTypesQuery()));

}