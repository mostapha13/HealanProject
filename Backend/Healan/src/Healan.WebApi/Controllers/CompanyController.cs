using Healan.Application.Companies.Commands.CompanyRegister;
using Healan.Application.Companies.Queries.CompanyList;
using Healan.Application.Companies.Queries.CompanyRegistrationTypes;
using Healan.Application.Companies.Queries.GetCompanyInfo;
using Microsoft.AspNetCore.Mvc;

namespace Healan.WebApi.Controllers;
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
    public async Task<IActionResult> Register(CompanyRegisterCommand request) =>
                                                                Ok(await Mediator.Send(request));

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