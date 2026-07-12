namespace Healan.Application.Portal.Services;

public record RagPythonAskResult(
    string Answer,
    bool WasAnswered,
    long? MatchedKnowledgeItemId,
    double? SimilarityScore,
    string? SourceType);

public interface IRagPythonService
{
    Task<RagPythonAskResult> AskAsync(
        string baseUrl,
        string question,
        int similarityThresholdPercent,
        CancellationToken cancellationToken = default);
}
