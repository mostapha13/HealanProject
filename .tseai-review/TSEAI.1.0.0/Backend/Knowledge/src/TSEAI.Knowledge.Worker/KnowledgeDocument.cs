namespace TSEAI.Knowledge.Worker;

public sealed record KnowledgeDocument(
    string DocumentId,
    string SourceType,
    string SourceId,
    string Title,
    string Body,
    string? Url,
    string? Symbol,
    string? Category,
    DateTimeOffset? PublishedAt,
    Dictionary<string, object?> Metadata);
