using System.Net.Mime;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc;
using SMSProvider.Application.Configs;
using SMSProvider.Application.Entities;
using SMSProvider.Application.Interfaces;
using SMSProvider.Application.Models;

namespace SMSProvider.WebApp.Controllers;

/// <summary>
/// سازگار با قرارداد فعلی Share.SmsApiService: POST {SMSBaseUrl}SendSMS
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Route("SMSProvider/api/v1/[controller]")]
public class SMSController : ControllerBase
{
    private readonly ISmsSender _smsSender;
    private readonly ISmsOutboxStore _outbox;
    private readonly ILogger<SMSController> _logger;

    public SMSController(ISmsSender smsSender, ISmsOutboxStore outbox, ILogger<SMSController> logger)
    {
        _smsSender = smsSender;
        _outbox = outbox;
        _logger = logger;
    }

    [HttpPost("SendSMS")]
    public async Task<IActionResult> SendSMS([FromBody] SendSmsCompatRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
            return BadRequest(new SendSmsResponse { ErrorMessage = "درخواست نامعتبر است." });

        var message = request.Message ?? string.Empty;
        var phones = request.PhoneNumbers?.Where(p => !string.IsNullOrWhiteSpace(p)).Distinct().ToList()
                     ?? new List<string>();

        var result = await _smsSender.SendAsync(new SendSmsRequest
        {
            Message = message,
            PhoneNumbers = phones,
        }, cancellationToken);

        var otp = OtpMessageHelper.TryExtractCode(message);
        var channel = result.Success
            ? (result.TraceNumber?.StartsWith("log-only", StringComparison.OrdinalIgnoreCase) == true ? "LogOnly" : "sms.ir")
            : "Failed";

        foreach (var phone in phones.DefaultIfEmpty("?"))
        {
            try
            {
                await _outbox.SaveAsync(new SmsOutboxLog
                {
                    CreatedAt = DateTime.Now,
                    PhoneNumber = phone,
                    Message = message,
                    ExtractedCode = otp,
                    Success = result.Success,
                    ErrorMessage = result.ErrorMessage,
                    TraceNumber = result.TraceNumber,
                    Channel = channel,
                }, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist SMS outbox for {Phone}", phone);
            }
        }

        if (!result.Success)
        {
            _logger.LogWarning("SendSMS failed: {Error}", result.ErrorMessage);
            return Ok(result);
        }

        return Ok(result);
    }

    /// <summary>لیست JSON پیامک‌های ارسالی (برای تست OTP)</summary>
    [HttpGet("List")]
    public async Task<IActionResult> List(
        [FromQuery] int take = 50,
        [FromQuery] string? phone = null,
        CancellationToken cancellationToken = default)
    {
        var items = await _outbox.ListAsync(take, phone, cancellationToken);
        return Ok(items.Select(x => new
        {
            x.Id,
            x.CreatedAt,
            x.PhoneNumber,
            x.ExtractedCode,
            x.Message,
            x.Success,
            x.ErrorMessage,
            x.TraceNumber,
            x.Channel,
        }));
    }

    /// <summary>گزارش HTML قابل مشاهده در مرورگر</summary>
    [HttpGet("Report")]
    public async Task<IActionResult> Report(
        [FromQuery] int take = 100,
        [FromQuery] string? phone = null,
        CancellationToken cancellationToken = default)
    {
        var items = await _outbox.ListAsync(take, phone, cancellationToken);
        var sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html><html lang='fa' dir='rtl'><head><meta charset='utf-8'/>");
        sb.AppendLine("<title>گزارش پیامک‌های ارسالی</title>");
        sb.AppendLine("<style>");
        sb.AppendLine("body{font-family:Tahoma,sans-serif;background:#f6f8fa;margin:1.5rem;color:#111}");
        sb.AppendLine("h1{font-size:1.25rem} table{width:100%;border-collapse:collapse;background:#fff}");
        sb.AppendLine("th,td{border:1px solid #ddd;padding:8px;font-size:0.9rem;text-align:right}");
        sb.AppendLine("th{background:#0f766e;color:#fff} .code{font-weight:700;color:#b91c1c;font-size:1.1rem}");
        sb.AppendLine(".ok{color:#047857}.fail{color:#b91c1c} .muted{color:#6b7280;font-size:0.8rem}");
        sb.AppendLine("</style></head><body>");
        sb.AppendLine("<h1>گزارش پیامک‌های ارسالی (برای تست OTP)</h1>");
        sb.AppendLine($"<p class='muted'>نمایش آخرین {items.Count} مورد · جدول Sql: SmsOutboxLogs</p>");
        sb.AppendLine("<table><thead><tr>");
        sb.AppendLine("<th>زمان</th><th>موبایل</th><th>کد</th><th>وضعیت</th><th>کانال</th><th>متن</th><th>خطا</th>");
        sb.AppendLine("</tr></thead><tbody>");
        foreach (var x in items)
        {
            sb.Append("<tr>");
            sb.Append($"<td>{HtmlEncoder.Default.Encode(x.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"))}</td>");
            sb.Append($"<td dir='ltr'>{HtmlEncoder.Default.Encode(x.PhoneNumber)}</td>");
            sb.Append($"<td class='code'>{HtmlEncoder.Default.Encode(x.ExtractedCode ?? "—")}</td>");
            sb.Append(x.Success
                ? "<td class='ok'>موفق</td>"
                : "<td class='fail'>ناموفق</td>");
            sb.Append($"<td>{HtmlEncoder.Default.Encode(x.Channel)}</td>");
            sb.Append($"<td>{HtmlEncoder.Default.Encode(x.Message)}</td>");
            sb.Append($"<td class='muted'>{HtmlEncoder.Default.Encode(x.ErrorMessage ?? "")}</td>");
            sb.AppendLine("</tr>");
        }

        if (items.Count == 0)
            sb.AppendLine("<tr><td colspan='7'>هنوز پیامکی ثبت نشده است.</td></tr>");

        sb.AppendLine("</tbody></table>");
        sb.AppendLine("<p class='muted'>JSON: <code>/api/v1/SMS/List</code> · SQL: <code>SELECT TOP 50 * FROM SmsOutboxLogs ORDER BY Id DESC</code></p>");
        sb.AppendLine("</body></html>");
        return Content(sb.ToString(), MediaTypeNames.Text.Html, Encoding.UTF8);
    }

    public class SendSmsCompatRequest
    {
        public string? Message { get; set; }
        public ICollection<string>? PhoneNumbers { get; set; }
    }
}
