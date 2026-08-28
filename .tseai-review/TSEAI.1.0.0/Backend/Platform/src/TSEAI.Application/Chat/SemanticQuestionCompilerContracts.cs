namespace TSEAI.Application.Chat;

public enum SemanticQuestionDomain
{
    Unknown = 0,
    Market,
    Company,
    CompanyState,
    Instrument,
    OrderBook,
    ClientType,
    FinancialInstitution,
    Content,
    Organization,
    MarketFilter,
    Knowledge
}

public enum SemanticQuestionOperation
{
    Unknown = 0,
    Lookup,
    Count,
    List,
    Rank,
    Compare,
    Latest,
    Aggregate,
    Relationship,
    Definition,
    Explain
}

public enum SemanticResponseShape
{
    Short = 0,
    NamesOnly,
    List,
    Table,
    Summary,
    Detailed
}

public sealed record SemanticEntityMention(string Kind,string Value);

public sealed record SemanticQuestionFrame(
    string OriginalQuestion,
    string CanonicalQuestion,
    SemanticQuestionDomain Domain,
    SemanticQuestionOperation Operation,
    IReadOnlyList<SemanticEntityMention> Entities,
    IReadOnlyList<string> Metrics,
    string? TemporalExpression,
    SemanticResponseShape ResponseShape,
    double Confidence,
    bool RequiresClarification,
    string? Clarification,
    IReadOnlyList<string> Reasons)
{
    public bool IsApplied => !RequiresClarification
        && Confidence>=0.70
        && Domain!=SemanticQuestionDomain.Unknown
        && !string.IsNullOrWhiteSpace(CanonicalQuestion);

    public bool RequiresAuthoritativeStructuredAnswer => Domain switch
    {
        SemanticQuestionDomain.Company or
        SemanticQuestionDomain.CompanyState or
        SemanticQuestionDomain.ClientType or
        SemanticQuestionDomain.FinancialInstitution => Operation!=SemanticQuestionOperation.Explain,
        SemanticQuestionDomain.Organization => Operation is SemanticQuestionOperation.Lookup
            or SemanticQuestionOperation.List or SemanticQuestionOperation.Relationship,
        SemanticQuestionDomain.Content => Operation is SemanticQuestionOperation.Count
            or SemanticQuestionOperation.Aggregate or SemanticQuestionOperation.Latest,
        _ => false
    };

    public string? PrimaryEntity => Entities.FirstOrDefault()?.Value;
    public string AuditSummary =>
        $"domain={Domain};operation={Operation};shape={ResponseShape};confidence={Confidence:0.###};applied={IsApplied};clarify={RequiresClarification};entities={string.Join('|',Entities.Select(x=>$"{x.Kind}:{x.Value}"))};metrics={string.Join('|',Metrics)};reasons={string.Join('|',Reasons)}";
}

public interface ISemanticQuestionCompiler
{
    Task<SemanticQuestionFrame?> CompileAsync(string question,CancellationToken ct);
}
