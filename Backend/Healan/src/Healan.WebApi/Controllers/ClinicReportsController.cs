using Healan.Application.Reports.Queries.GetClinicAnalytics;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// گزارش‌های تحلیلی کلینیک
/// </summary>
[AccessForm(HealanAccessFormIds.Reports)]
public class ClinicReportsController : ApiControllerBase
{
    [HttpGet("[action]")]
    public async Task<IActionResult> Analytics([FromQuery] GetClinicAnalyticsQuery request) =>
        Ok(await Mediator.Send(request));
}
