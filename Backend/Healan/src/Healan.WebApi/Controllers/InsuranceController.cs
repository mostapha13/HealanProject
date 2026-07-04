using Healan.Application.Insurances.Commands.InsuranceRegister;
using Healan.Application.Insurances.Commands.RegisterInsuranceContract;
using Healan.Application.Insurances.Queries.GetInsuranceContractInfo;
using Healan.Application.Insurances.Queries.GetInsuranceInfo;
using Healan.Application.Insurances.Queries.InsuranceContractList;
using Healan.Application.Insurances.Queries.InsuranceList;
using Healan.Application.Insurances.Queries.InsuranceType;
using Healan.Domain.Insurances.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Healan.WebApi.Controllers;

/// <summary>
/// بیمه
/// </summary>
public class InsuranceController : ApiControllerBase
{
    /// <summary>
    /// لیست بیمه
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> InsuranceList([FromQuery] InsuranceListQuery request) =>
                                                                Ok(await Mediator.Send(request));

    /// <summary>
    /// افزودن بیمه
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public async Task<IActionResult> Register(InsuranceRegisterCommand request) =>
                                                                Ok(await Mediator.Send(request));

    /// <summary>
    /// اطلاعات بیمه
    /// </summary>
    /// <param name="insuranceId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> InsuranceInfo([FromQuery] int insuranceCompanyId) => Ok(await Mediator.Send(new GetInsuranceInfoQuery { InsuranceCompanyId = insuranceCompanyId }));


    /// <summary>
    /// نوع بیمه
    /// </summary>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> InsuranceType() => Ok(await Mediator.Send(new InsuranceTypeQuery ()));

    /// <summary>
    /// ثبت قرارداد با بیمه
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("[action]")]
    public async Task<IActionResult> RegisterInsuranceContract(RegisterInsuranceContractCommand request) =>
                                                            Ok(await Mediator.Send(request));

    /// <summary>
    /// لیست قراردادها
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> InsuranceContractList([FromQuery] InsuranceContractListQuery request) =>
                                                            Ok(await Mediator.Send(request));

    /// <summary>
    /// جزئیات قرارداد
    /// </summary>
    /// <param name="insuranceContractId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> InsuranceContractInfo([FromQuery] int insuranceContractId) => Ok(await Mediator.Send(new GetInsuranceContractInfoQuery { InsuranceContractId = insuranceContractId }));


}