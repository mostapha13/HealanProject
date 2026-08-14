using System.Net.Http.Headers;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Services;

public record RagPythonAskResult(
    string Answer,
    bool WasAnswered,
    long? MatchedKnowledgeItemId,
    double? SimilarityScore,
    string? SourceType);

public record RagPythonSttResult(string Text, string Language, double? DurationSeconds, string? Model);

public record RagPythonStatusResult(
    bool IsAvailable,
    int DocumentCount,
    bool Ingesting,
    string? LastIngestError,
    string? DataSource,
    string? EmbeddingModel);

public record RagPythonIngestResult(int Indexed, int DocumentCount, string? Source, string? EmbeddingModel);

public interface IRagPythonService
{
    Task<RagPythonAskResult> AskAsync(
        string baseUrl,
        string question,
        int similarityThresholdPercent,
        CancellationToken cancellationToken = default);

    Task<RagPythonSttResult> SpeechToTextAsync(
        string baseUrl,
        byte[] audioContent,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<RagPythonStatusResult> GetStatusAsync(
        string baseUrl,
        CancellationToken cancellationToken = default);

    Task<RagPythonIngestResult> IngestAsync(
        string baseUrl,
        CancellationToken cancellationToken = default);
}
