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
    private readonly ISmsDispatchService _dispatch;
    private readonly ISmsOutboxStore _outbox;
    private readonly ILogger<SMSController> _logger;

    public SMSController(ISmsDispatchService dispatch, ISmsOutboxStore outbox, ILogger<SMSController> logger)
    {
        _dispatch = dispatch;
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

        var sendRequest = new SendSmsRequest
        {
            Message = message,
            PhoneNumbers = phones,
        };

        var (result, queued) = await _dispatch.DispatchAsync(sendRequest, cancellationToken);

        if (!queued)
        {
            await SaveOutboxAsync(message, phones, result, cancellationToken);
        }

        if (!result.Success)
        {
            _logger.LogWarning("SendSMS failed: {Error}", result.ErrorMessage);
            return Ok(result);
        }

        return Ok(result);
    }

    private async Task SaveOutboxAsync(
        string message,
        IReadOnlyList<string> phones,
        SendSmsResponse result,
        CancellationToken cancellationToken)
    {
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
    }

    /// <summary>لیست JSON پیامک‌های ارسالی (صفحه‌بندی‌شده)</summary>
    [HttpGet("List")]
    public async Task<IActionResult> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? phone = null,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _outbox.ListPagedAsync(pageNumber, pageSize, phone, cancellationToken);
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : Math.Min(pageSize, 20);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        if (totalPages > 0 && pageNumber > totalPages)
            pageNumber = totalPages;

        return Ok(new
        {
            items = items.Select(MapItem),
            pageNumber,
            totalPages,
            totalCount,
            hasPreviousPage = pageNumber > 1,
            hasNextPage = pageNumber < totalPages,
        });
    }

    /// <summary>گزارش HTML قابل مشاهده در مرورگر</summary>
    [HttpGet("Report")]
    public async Task<IActionResult> Report(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? phone = null,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _outbox.ListPagedAsync(pageNumber, pageSize, phone, cancellationToken);
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
        sb.AppendLine($"<p class='muted'>صفحه {pageNumber} · {items.Count} از {totalCount} مورد · جدول Sql: SmsOutboxLogs</p>");
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
        sb.AppendLine("<p class='muted'>JSON: <code>/api/v1/SMS/List</code></p>");
        sb.AppendLine("</body></html>");
        return Content(sb.ToString(), MediaTypeNames.Text.Html, Encoding.UTF8);
    }

    private static object MapItem(SmsOutboxLog x) => new
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
    };

    public class SendSmsCompatRequest
    {
        public string? Message { get; set; }
        public ICollection<string>? PhoneNumbers { get; set; }
    }
}
