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
}
