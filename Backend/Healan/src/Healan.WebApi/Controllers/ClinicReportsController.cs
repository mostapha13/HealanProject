using Healan.Application.Reports.Commands.SaveSmsSettings;
using Healan.Application.Reports.Queries.GetClinicAnalytics;
using Healan.Application.Reports.Queries.GetSmsOutboxList;
using Healan.Application.Reports.Queries.GetSmsSettings;
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

    /// <summary>لیست پیامک‌های ارسالی (OTP / فراموشی رمز و ...)</summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> SmsOutbox([FromQuery] GetSmsOutboxListQuery request) =>
        Ok(await Mediator.Send(request));

    /// <summary>خواندن تنظیمات پیامک (ApiKey ماسک‌شده)</summary>
    [HttpGet("[action]")]
    public async Task<IActionResult> SmsSettings() =>
        Ok(await Mediator.Send(new GetSmsSettingsQuery()));

    /// <summary>ذخیره تنظیمات پیامک و همگام‌سازی با SMSProvider</summary>
    [HttpPost("[action]")]
    public async Task<IActionResult> SmsSettingsSave([FromBody] SaveSmsSettingsCommand request) =>
        Ok(await Mediator.Send(request));
}
