using System.Net.Http.Json;
using System.Text.Json.Serialization;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Models;
using Share.Domain.Exceptions;

namespace Healan.Application.Reports.Queries.GetSmsOutboxList;

public class GetSmsOutboxListQuery : AbstractSearchRequest<PaginatedList<SmsOutboxItemResult>>
{
    public string? Phone { get; set; }
}

public class SmsOutboxItemResult
{
    public long Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ExtractedCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? TraceNumber { get; set; }
    public string Channel { get; set; } = string.Empty;
}

public class GetSmsOutboxListQueryHandler : IRequestHandler<GetSmsOutboxListQuery, PaginatedList<SmsOutboxItemResult>>
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GetSmsOutboxListQueryHandler> _logger;

    public GetSmsOutboxListQueryHandler(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GetSmsOutboxListQueryHandler> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<PaginatedList<SmsOutboxItemResult>> Handle(GetSmsOutboxListQuery request, CancellationToken cancellationToken)
    {
        var baseUrl = _configuration["SMSProviderBaseUrl"]?.Trim();
        if (string.IsNullOrWhiteSpace(baseUrl))
            throw new BadRequestExceptions("آدرس SMSProvider (SMSProviderBaseUrl) تنظیم نشده است.");

        if (!baseUrl.EndsWith('/'))
            baseUrl += "/";

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : Math.Min(request.PageSize, 20);
        var url = $"List?pageNumber={pageNumber}&pageSize={pageSize}";
        if (!string.IsNullOrWhiteSpace(request.Phone))
            url += $"&phone={Uri.EscapeDataString(request.Phone.Trim())}";

        try
        {
            var client = _httpClientFactory.CreateClient("SMSProvider");
            client.BaseAddress ??= new Uri(baseUrl);

            using var response = await client.GetAsync(url, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("SMSProvider List failed: {Status} {Body}", (int)response.StatusCode, body);
                throw new BadRequestExceptions("دریافت لیست پیامک از SMSProvider ناموفق بود.");
            }

            var page = string.IsNullOrWhiteSpace(body)
                ? null
                : System.Text.Json.JsonSerializer.Deserialize<SmsOutboxPageDto>(
                    body,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var items = (page?.Items ?? new List<SmsOutboxDto>())
                .Select(x => new SmsOutboxItemResult
                {
                    Id = x.Id,
                    CreatedAt = x.CreatedAt,
                    PhoneNumber = x.PhoneNumber ?? string.Empty,
                    ExtractedCode = x.ExtractedCode,
                    Message = x.Message ?? string.Empty,
                    Success = x.Success,
                    ErrorMessage = x.ErrorMessage,
                    TraceNumber = x.TraceNumber,
                    Channel = x.Channel ?? string.Empty,
                })
                .ToList();

            return new PaginatedList<SmsOutboxItemResult>(
                items,
                page?.TotalCount ?? items.Count,
                page?.PageNumber ?? pageNumber,
                pageSize);
        }
        catch (BadRequestExceptions)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMSProvider List error");
            throw new BadRequestExceptions($"خطا در ارتباط با SMSProvider: {ex.Message}");
        }
    }

    private sealed class SmsOutboxPageDto
    {
        [JsonPropertyName("items")]
        public List<SmsOutboxDto>? Items { get; set; }
        [JsonPropertyName("pageNumber")]
        public int PageNumber { get; set; }
        [JsonPropertyName("totalPages")]
        public int TotalPages { get; set; }
        [JsonPropertyName("totalCount")]
        public int TotalCount { get; set; }
    }

    private sealed class SmsOutboxDto
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
        [JsonPropertyName("phoneNumber")]
        public string? PhoneNumber { get; set; }
        [JsonPropertyName("extractedCode")]
        public string? ExtractedCode { get; set; }
        [JsonPropertyName("message")]
        public string? Message { get; set; }
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        [JsonPropertyName("errorMessage")]
        public string? ErrorMessage { get; set; }
        [JsonPropertyName("traceNumber")]
        public string? TraceNumber { get; set; }
        [JsonPropertyName("channel")]
        public string? Channel { get; set; }
    }
}
