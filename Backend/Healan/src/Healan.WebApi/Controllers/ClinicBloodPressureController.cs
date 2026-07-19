using Healan.Application.Patients.Queries.PatientBloodPressureHistory;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// مشاهده فشار خون ثبت‌شده توسط بیمار (کلینیک)
/// </summary>
[AccessForm(HealanAccessFormIds.ClinicBloodPressure)]
public class ClinicBloodPressureController : ApiControllerBase
{
    /// <summary>
    /// لیست فشار خون با کد ملی یا شناسه بیمار
    /// </summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> History(
        [FromQuery] string? nationalCode,
        [FromQuery] long? patientId) =>
        Ok(await Mediator.Send(new PatientBloodPressureHistoryQuery
        {
            NationalCode = nationalCode,
            PatientId = patientId,
        }));
}
