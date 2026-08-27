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
    double Confidence = 1,
    string? SourceTool = null)
{
    public string ToolName => SourceTool ?? CanonicalReferenceToolRegistry.Resolve(Reference.Kind, Reference.Topic);

    public static CanonicalReferenceAnswer Exact(
        string answer,
        string kind,
        string topic,
        IReadOnlyList<CanonicalReferenceFact>? facts = null,
        string? subjectName = null,
        string? subjectRole = null,
        IReadOnlyList<string>? relatedSubjects = null,
        double confidence = 1,
        string? sourceTool = null)
        => new(answer,new(kind,topic,subjectName,subjectRole,relatedSubjects??[]),
            facts??[new("canonical_answer",answer,$"{kind}:{topic}")],true,[],[],confidence,sourceTool);
}

public static class CanonicalReferenceToolNames
{
    public const string ClockCurrent = "sql.clock.current";
    public const string ContentLookup = "sql.content.lookup";
    public const string CompanyLookup = "sql.company.lookup";
    public const string CompanyIpo = "sql.company.ipo";
    public const string CompanyState = "sql.company.state";
    public const string OrganizationPeople = "sql.organization.people";
    public const string ClientType = "sql.market.clienttype";
    public const string Instrument = "sql.market.instrument";
    public const string FinancialInstitution = "sql.financial_institution.lookup";
    public const string NewsLatest = "sql.content.latest_news";
    public const string RegionHall = "sql.region_hall.lookup";
    public const string MarketReference = "sql.market.reference";
    public const string GenericReference = "sql.reference.lookup";

    public static readonly IReadOnlySet<string> Allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ClockCurrent, ContentLookup, CompanyLookup, CompanyIpo, CompanyState, OrganizationPeople,
        ClientType, Instrument, FinancialInstitution, NewsLatest, RegionHall, MarketReference, GenericReference
    };
}

/// <summary>
/// Maps every canonical answer family to a bounded, auditable SQL tool. The
/// model never supplies table names or SQL text; it can only select one of
/// these semantic operations and the implementation keeps using parameterized
/// queries owned by the application.
/// </summary>
public static class CanonicalReferenceToolRegistry
{
    public static string Resolve(string kind, string topic)
    {
        var normalizedKind = (kind ?? string.Empty).Trim().ToLowerInvariant();
        return normalizedKind switch
        {
            "clock" => CanonicalReferenceToolNames.ClockCurrent,
            "content_reference" => CanonicalReferenceToolNames.ContentLookup,
            "company" or "company_comparison" or "company_aggregate" when ContainsIpo(topic) => CanonicalReferenceToolNames.CompanyIpo,
            "company" or "company_comparison" or "company_aggregate" => CanonicalReferenceToolNames.CompanyLookup,
            "company_state" or "company_state_comparison" => CanonicalReferenceToolNames.CompanyState,
            "organization_person" or "organization_unit" or "organization_board" => CanonicalReferenceToolNames.OrganizationPeople,
            "client_type" => CanonicalReferenceToolNames.ClientType,
            "instrument" => CanonicalReferenceToolNames.Instrument,
            "financial_institution" or "financial_institution_comparison" => CanonicalReferenceToolNames.FinancialInstitution,
            "news" => CanonicalReferenceToolNames.NewsLatest,
            "hall" => CanonicalReferenceToolNames.RegionHall,
            "market_reference" => CanonicalReferenceToolNames.MarketReference,
            _ => CanonicalReferenceToolNames.GenericReference
        };
    }

    private static bool ContainsIpo(string? topic)
        => topic?.Contains("عرضه", StringComparison.Ordinal) == true
           && topic.Contains("اولیه", StringComparison.Ordinal);
}
