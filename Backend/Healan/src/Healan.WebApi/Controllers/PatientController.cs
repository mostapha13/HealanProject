using Healan.Application.Patients.Commands.PatientRegister;
using Healan.Application.Patients.Queries.GetPatientInfo;
using Healan.Application.Patients.Queries.PatientBloodPressureHistory;
using Healan.Application.Patients.Queries.PatientInfoByNationalCode;
using Healan.Application.Patients.Queries.PatientList;
using Healan.Application.Patients.Queries.PatientVisitHistory;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// بیمار
/// </summary>
[AccessForm(HealanAccessFormIds.Patients)]
public class PatientController : ApiControllerBase
{
    /// <summary>
    /// لیست بیمار
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> PatientList([FromQuery] PatientListQuery request) =>
                                                                Ok(await Mediator.Send(request));

    /// <summary>
    /// افزودن بیمار
    /// </summary>
    [HttpPost("[action]")]
    public Task<IActionResult> Register([FromBody] PatientRegisterCommand request) =>
        SendCommand(request);

    /// <summary>
    /// اطلاعات بیمار
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> PatientInfo([FromQuery] int patientId) => Ok(await Mediator.Send(new GetPatientInfoQuery { PatientId = patientId }));

    /// <summary>
    /// اطلاعات بیمار با کد ملی
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> PatientInfoByNationalCode([FromQuery] string nationalCode) => Ok(await Mediator.Send(new PatientInfoByNationalCodeQuery { nationalCode = nationalCode }));

    /// <summary>
    /// سوابق ویزیت بیمار (فقط مشاهده)
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> VisitHistory([FromQuery] long patientId) =>
        Ok(await Mediator.Send(new PatientVisitHistoryQuery { PatientId = patientId }));

    /// <summary>
    /// سوابق فشار خون ثبت‌شده توسط بیمار (کد ملی یا شناسه بیمار)
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> BloodPressureHistory(
        [FromQuery] string? nationalCode,
        [FromQuery] long? patientId) =>
        Ok(await Mediator.Send(new PatientBloodPressureHistoryQuery
        {
            NationalCode = nationalCode,
            PatientId = patientId,
        }));
}