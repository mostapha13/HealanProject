using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Services;

public class RagPythonService : IRagPythonService
{
    private const int MaxLoggedBodyLength = 800;

    private readonly HttpClient _httpClient;
    private readonly ILogger<RagPythonService> _logger;

    public RagPythonService(HttpClient httpClient, ILogger<RagPythonService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<RagPythonAskResult> AskAsync(
        string baseUrl,
        string question,
        int similarityThresholdPercent,
        CancellationToken cancellationToken = default)
    {
        var url = $"{baseUrl.TrimEnd('/')}/api/v1/rag/ask";
        var payload = new
        {
            question,
            similarity_threshold = similarityThresholdPercent / 100.0,
            top_k = 3,
            answer_mode = "direct",
        };

        _logger.LogInformation(
            "RAG ask started. Url={Url}, QuestionLength={QuestionLength}, ThresholdPercent={ThresholdPercent}, Question={Question}",
            url,
            question.Length,
            similarityThresholdPercent,
            TruncateForLog(question, 200));

        string body;
        try
        {
            using var response = await _httpClient.PostAsJsonAsync(url, payload, cancellationToken);
            body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "RAG Python API returned error. Url={Url}, StatusCode={StatusCode}, Reason={ReasonPhrase}, Body={Body}",
                    url,
                    (int)response.StatusCode,
                    response.ReasonPhrase,
                    TruncateForLog(body));
                return UnavailableResult();
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(
                ex,
                "RAG Python API connection failed. Url={Url}, Message={Message}, Inner={InnerMessage}",
                url,
                ex.Message,
                ex.InnerException?.Message);
            return UnavailableResult();
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(
                ex,
                "RAG Python API timed out. Url={Url}, TimeoutSeconds={TimeoutSeconds}",
                url,
                _httpClient.Timeout.TotalSeconds);
            return UnavailableResult();
        }
        catch (TaskCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogInformation("RAG ask cancelled by caller. Url={Url}", url);
            throw;
        }

        var parsed = System.Text.Json.JsonSerializer.Deserialize<RagPythonApiResponse>(body);
        if (parsed == null)
        {
            _logger.LogWarning(
                "RAG Python API returned unparseable JSON. Url={Url}, Body={Body}",
                url,
                TruncateForLog(body));
            return new RagPythonAskResult(
                "خطا در دریافت پاسخ. لطفاً دوباره تلاش کنید.",
                false,
                null,
                null,
                null);
        }

        long? matchedId = null;
        if (parsed.MatchedId is not null && long.TryParse(parsed.MatchedId, out var id))
            matchedId = id;

        _logger.LogInformation(
            "RAG ask completed. Url={Url}, WasAnswered={WasAnswered}, SimilarityScore={SimilarityScore}, MatchedId={MatchedId}, SourceType={SourceType}, AnswerPreview={AnswerPreview}",
            url,
            parsed.WasAnswered,
            parsed.SimilarityScore,
            matchedId,
            parsed.SourceType,
            TruncateForLog(parsed.Answer, 120));

        return new RagPythonAskResult(
            parsed.Answer ?? string.Empty,
            parsed.WasAnswered,
            matchedId,
            parsed.SimilarityScore,
            parsed.SourceType);
    }

    public async Task<RagPythonSttResult> SpeechToTextAsync(
        string baseUrl,
        byte[] audioContent,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(audioContent);
        if (audioContent.Length == 0)
            throw new BadRequestExceptions("فایل صوتی خالی است.");

        var url = $"{baseUrl.TrimEnd('/')}/api/v1/rag/stt";
        var safeName = string.IsNullOrWhiteSpace(fileName) ? "voice.webm" : fileName.Trim();
        var mediaType = string.IsNullOrWhiteSpace(contentType) ? "audio/webm" : contentType.Trim();
        // Browsers often send "audio/webm;codecs=opus" — keep only the media type for HttpClient
        var semi = mediaType.IndexOf(';');
        if (semi >= 0)
            mediaType = mediaType[..semi].Trim();
        if (string.IsNullOrWhiteSpace(mediaType))
            mediaType = "audio/webm";

        _logger.LogInformation(
            "RAG STT started. Url={Url}, Bytes={Bytes}, FileName={FileName}",
            url,
            audioContent.Length,
            safeName);

        using var form = new MultipartFormDataContent();
        using var streamContent = new ByteArrayContent(audioContent);
        streamContent.Headers.ContentType = MediaTypeHeaderValue.Parse(mediaType);
        form.Add(streamContent, "file", safeName);

        string body;
        try
        {
            using var response = await _httpClient.PostAsync(url, form, cancellationToken);
            body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "RAG STT error. Url={Url}, Status={Status}, Body={Body}",
                    url,
                    (int)response.StatusCode,
                    TruncateForLog(body));
                var detail = TryReadDetail(body);
                throw new BadRequestExceptions(
                    string.IsNullOrWhiteSpace(detail)
                        ? "تبدیل گفتار به متن ناموفق بود. لطفاً دوباره تلاش کنید."
                        : detail);
            }
        }
        catch (BadRequestExceptions)
        {
            throw;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "RAG STT connection failed. Url={Url}", url);
            throw new BadRequestExceptions("سرویس گفتار به متن موقتاً در دسترس نیست.");
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "RAG STT timed out. Url={Url}", url);
            throw new BadRequestExceptions("تبدیل گفتار به متن طولانی شد. لطفاً کوتاه‌تر صحبت کنید.");
        }

        var parsed = System.Text.Json.JsonSerializer.Deserialize<RagPythonSttResponse>(body);
        if (parsed == null || string.IsNullOrWhiteSpace(parsed.Text))
            throw new BadRequestExceptions("گفتاری تشخیص داده نشد. لطفاً دوباره واضح‌تر صحبت کنید.");

        return new RagPythonSttResult(
            parsed.Text.Trim(),
            string.IsNullOrWhiteSpace(parsed.Language) ? "fa" : parsed.Language,
            parsed.DurationSeconds,
            parsed.Model);
    }

    private static string? TryReadDetail(string body)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("detail", out var detail))
            {
                if (detail.ValueKind == System.Text.Json.JsonValueKind.String)
                    return detail.GetString();
            }
        }
        catch
        {
            // ignore
        }
        return null;
    }

    private static string TruncateForLog(string? value, int maxLength = MaxLoggedBodyLength)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;
        return value.Length <= maxLength ? value : value[..maxLength] + "...";
    }

    private static RagPythonAskResult UnavailableResult() =>
        new(
            "سرویس پاسخ‌گویی هوشمند موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.",
            false,
            null,
            null,
            null);

    private sealed class RagPythonApiResponse
    {
        [JsonPropertyName("answer")]
        public string? Answer { get; set; }

        [JsonPropertyName("was_answered")]
        public bool WasAnswered { get; set; }

        [JsonPropertyName("similarity_score")]
        public double? SimilarityScore { get; set; }

        [JsonPropertyName("matched_id")]
        public string? MatchedId { get; set; }

        [JsonPropertyName("source_type")]
        public string? SourceType { get; set; }
    }

    private sealed class RagPythonSttResponse
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("language")]
        public string? Language { get; set; }

        [JsonPropertyName("duration_seconds")]
        public double? DurationSeconds { get; set; }

        [JsonPropertyName("model")]
        public string? Model { get; set; }
    }
}
