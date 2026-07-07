using Healan.Application.Dashboard.Queries.GetDashboardStats;
using Microsoft.AspNetCore.Mvc;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// داشبورد مدیریتی کلینیک
/// </summary>
[AccessForm(HealanAccessFormIds.Dashboard)]
public class DashboardController : ApiControllerBase
{
    [HttpGet("[action]")]
    public async Task<IActionResult> Stats() =>
        Ok(await Mediator.Send(new GetDashboardStatsQuery()));
}
