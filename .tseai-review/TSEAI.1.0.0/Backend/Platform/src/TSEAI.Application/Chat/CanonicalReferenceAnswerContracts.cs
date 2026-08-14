using TSEAI.Application.Temporal;

namespace TSEAI.Application.Chat;

/// <summary>
/// Handles exact questions whose answer belongs in canonical SQL, not semantic search.
/// This includes latest records, counts and exact market facts.
/// </summary>
public interface ICanonicalReferenceAnswerService
{
    Task<string?> TryAnswerAsync(string question, TemporalResolution temporal, CancellationToken ct);
}
