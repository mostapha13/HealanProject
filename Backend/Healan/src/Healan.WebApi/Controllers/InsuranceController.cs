using Healan.Application.Common.MasterData;
using Healan.Application.Insurances.Commands.InsuranceRegister;
using Healan.Application.Insurances.Commands.RegisterInsuranceContract;
using Healan.Application.Insurances.Queries.GetInsuranceContractInfo;
using Healan.Application.Insurances.Queries.GetInsuranceInfo;
using Healan.Application.Insurances.Queries.InsuranceContractList;
using Healan.Application.Insurances.Queries.InsuranceList;
using Healan.Application.Insurances.Queries.InsuranceType;
using Healan.Domain.Insurances.Entities;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// بیمه
/// </summary>
[AccessForm(HealanAccessFormIds.Insurance)]
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
    public Task<IActionResult> Register([FromBody] InsuranceRegisterCommand request) =>
        SendCommand(request);

    /// <summary>
    /// اطلاعات بیمه
    /// </summary>
    /// <param name="insuranceId"></param>
    /// <returns></returns>
    [HttpGet("[action]")]
    public async Task<IActionResult> InsuranceInfo([FromQuery] int insuranceCompanyId) => Ok(await Mediator.Send(new GetInsuranceInfoQuery { InsuranceCompanyId = insuranceCompanyId }));

    [HttpGet("[action]")]
    public async Task<IActionResult> DeletedInsuranceList() =>
        Ok(await Mediator.Send(new MasterDataDeletedListQuery { Type = MasterDataType.InsuranceCompany }));

    [HttpPost("[action]")]
    public async Task<IActionResult> DeleteInsurance([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataDeleteCommand { Type = MasterDataType.InsuranceCompany, Id = request.Id }));

    [HttpPost("[action]")]
    public async Task<IActionResult> RestoreInsurance([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataRestoreCommand { Type = MasterDataType.InsuranceCompany, Id = request.Id }));


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
    public Task<IActionResult> RegisterInsuranceContract([FromBody] RegisterInsuranceContractCommand request) =>
        SendCommand(request);

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

    [HttpGet("[action]")]
    public async Task<IActionResult> DeletedInsuranceContractList() =>
        Ok(await Mediator.Send(new MasterDataDeletedListQuery { Type = MasterDataType.InsuranceContract }));

    [HttpPost("[action]")]
    public async Task<IActionResult> DeleteInsuranceContract([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataDeleteCommand { Type = MasterDataType.InsuranceContract, Id = request.Id }));

    [HttpPost("[action]")]
    public async Task<IActionResult> RestoreInsuranceContract([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataRestoreCommand { Type = MasterDataType.InsuranceContract, Id = request.Id }));

}