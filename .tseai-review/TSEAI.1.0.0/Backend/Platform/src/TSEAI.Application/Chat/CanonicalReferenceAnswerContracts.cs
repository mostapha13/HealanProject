using TSEAI.Application.Temporal;

namespace TSEAI.Application.Chat;

/// <summary>
/// Handles exact questions whose answer belongs in canonical SQL, not semantic search.
/// This includes latest records, counts and exact market facts.
/// </summary>
public interface ICanonicalReferenceAnswerService
{
    Task<CanonicalReferenceAnswer?> TryAnswerAsync(string question, TemporalResolution temporal, CancellationToken ct);
}

public sealed record CanonicalReferenceContext(
    string Kind,
    string Topic,
    string? SubjectName,
    string? SubjectRole,
    IReadOnlyList<string> RelatedSubjects);

public sealed record CanonicalReferenceFact(
    string Key,
    string Value,
    string SourceId,
    DateTimeOffset? EffectiveAt = null);

public sealed record CanonicalReferenceAnswer(
    string Answer,
    CanonicalReferenceContext Reference,
    IReadOnlyList<CanonicalReferenceFact> Facts,
    bool IsComplete,
    IReadOnlyList<string> MissingFacets,
    IReadOnlyList<string> KnowledgeQueries,
    double Confidence = 1)
{
    public static CanonicalReferenceAnswer Exact(
        string answer,
        string kind,
        string topic,
        IReadOnlyList<CanonicalReferenceFact>? facts = null,
        string? subjectName = null,
        string? subjectRole = null,
        IReadOnlyList<string>? relatedSubjects = null,
        double confidence = 1)
        => new(answer,new(kind,topic,subjectName,subjectRole,relatedSubjects??[]),
            facts??[new("canonical_answer",answer,$"{kind}:{topic}")],true,[],[],confidence);
}
