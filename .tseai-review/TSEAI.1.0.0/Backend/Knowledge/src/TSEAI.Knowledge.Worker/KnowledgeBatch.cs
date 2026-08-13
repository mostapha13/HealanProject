namespace TSEAI.Knowledge.Worker;

public sealed record KnowledgeBatch(
    IReadOnlyList<KnowledgeDocument> Documents,
    IngestionCheckpoint? MaxCheckpoint);
