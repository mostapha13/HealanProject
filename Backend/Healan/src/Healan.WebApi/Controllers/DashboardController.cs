using Healan.Application.Dashboard.Queries.GetDashboardStats;
using Microsoft.AspNetCore.Mvc;

namespace Healan.WebApi.Controllers;

/// <summary>
/// داشبورد مدیریتی کلینیک
/// </summary>
public class DashboardController : ApiControllerBase
{
    [HttpGet("[action]")]
    public async Task<IActionResult> Stats() =>
        Ok(await Mediator.Send(new GetDashboardStatsQuery()));
}
