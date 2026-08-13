namespace TSEAI.Application.Entities;

public enum EntityKind
{
    Instrument = 1,
    MarketIndex = 2,
    Company = 3,
    TsePerson = 4,
    RegionHall = 5,
    FinancialInstitution = 6
}

public enum EntityResolutionStatus
{
    Resolved = 1,
    Ambiguous = 2,
    NoMatch = 3,
    Invalid = 4
}

public enum EntityMatchKind
{
    None = 0,
    ExactIdentifier = 1,
    ExactSymbol = 2,
    ExactName = 3,
    ExactAlias = 4,
    CompactExact = 5,
    Prefix = 6,
    Contains = 7
}

public sealed record EntitySourceCandidate(
    EntityKind Kind,
    string CanonicalId,
    string DisplayName,
    string? Symbol,
    string? InstrumentId,
    long? InsCode,
    string? Isin,
    IReadOnlyList<string> Aliases,
    IReadOnlyDictionary<string, string?> Metadata);

public sealed record EntitySearchRequest(
    string OriginalText,
    string NormalizedText,
    string CompactText,
    IReadOnlyList<EntityKind> ExpectedKinds,
    int Limit);

public sealed record EntityCandidateMatch(
    EntityKind Kind,
    string CanonicalId,
    string DisplayName,
    string? Symbol,
    string? InstrumentId,
    long? InsCode,
    string? Isin,
    double Score,
    EntityMatchKind MatchKind,
    string MatchedValue,
    IReadOnlyDictionary<string, string?> Metadata);

public sealed record EntityResolveOptions(
    IReadOnlyList<EntityKind>? ExpectedKinds = null,
    int MaxCandidates = 5,
    double MinimumScore = 0.72,
    double AmbiguityDelta = 0.035);

public sealed record EntityResolution(
    EntityResolutionStatus Status,
    string OriginalText,
    string NormalizedText,
    EntityCandidateMatch? Selected,
    IReadOnlyList<EntityCandidateMatch> Candidates,
    string? Clarification,
    string ResolverVersion = "persian-entity-v1");

public interface IEntityCandidateSource
{
    Task<IReadOnlyList<EntitySourceCandidate>> SearchAsync(EntitySearchRequest request, CancellationToken ct);
}

public interface IPersianEntityResolver
{
    Task<EntityResolution> ResolveAsync(string text, EntityResolveOptions? options, CancellationToken ct);
}
