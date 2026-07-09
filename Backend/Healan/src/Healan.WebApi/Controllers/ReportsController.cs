using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Healan.WebApi.Controllers;

/// <summary>
/// فایل‌های قالب گزارش (Stimulsoft و ... )
/// </summary>
[AllowAnonymous]
[Route("Reports")]
public class ReportsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public ReportsController(IWebHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// قالب گزارش اکو — wwwroot/reports/EchoReport.mrt
    /// </summary>
    [HttpGet("EchoTemplate")]
    public IActionResult EchoTemplate()
    {
        var path = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "reports", "EchoReport.mrt");
        if (!System.IO.File.Exists(path))
            return NotFound("قالب اکو یافت نشد");

        var bytes = System.IO.File.ReadAllBytes(path);
        return File(bytes, "application/json", "EchoReport.mrt");
    }
}
