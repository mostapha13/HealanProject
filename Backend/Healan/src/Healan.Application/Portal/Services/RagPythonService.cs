using System.Net.Http.Json;

using System.Text.Json.Serialization;

using Microsoft.Extensions.Logging;



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

}


