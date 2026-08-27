namespace TSEAI.Application.Chat.Agentic;

public sealed class ChatToolPolicy : IChatToolPolicy
{
    private static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        "planner",
        "capability.route",
        "conversation.context",
        "temporal.resolve",
        "entity.resolve",
        "market.symbol",
        "data-quality.market",
        "structured.market.symbol",
        "structured.market.orderbook",
        "structured.market.clienttype",
        "structured.market.summary",
        "structured.market.indexes",
        "analytics.symbol",
        "knowledge.retrieve",
        "filter.conversation","filter.chat","filter.assets",
        "structured.query",
        "structured.reference",
        CanonicalReferenceToolNames.ClockCurrent,
        CanonicalReferenceToolNames.ContentLookup,
        CanonicalReferenceToolNames.CompanyLookup,
        CanonicalReferenceToolNames.CompanyIpo,
        CanonicalReferenceToolNames.CompanyState,
        CanonicalReferenceToolNames.OrganizationPeople,
        CanonicalReferenceToolNames.ClientType,
        CanonicalReferenceToolNames.Instrument,
        CanonicalReferenceToolNames.FinancialInstitution,
        CanonicalReferenceToolNames.NewsLatest,
        CanonicalReferenceToolNames.RegionHall,
        CanonicalReferenceToolNames.MarketReference,
        CanonicalReferenceToolNames.GenericReference,
        "answer.synthesize",
        "reflection.review",
        "reflection.review.final"
    };

    public void Demand(string toolName)
    {
        if (!Allowed.Contains(toolName))
            throw new UnauthorizedAccessException($"Chat tool '{toolName}' is not allow-listed.");
    }

    public bool IsAllowed(string toolName) => Allowed.Contains(toolName);
}
