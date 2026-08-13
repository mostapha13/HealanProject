namespace TSEAI.Knowledge.Worker;

public sealed class KnowledgeSourceRegistry(KnowledgeOptions options)
{
    public IReadOnlyList<KnowledgeSourceOptions> Build(IReadOnlyList<KnowledgeSourceOptions> discovered)
    {
        var configured = options.Sources.Where(x => x.Enabled && !string.IsNullOrWhiteSpace(x.Query));
        var result = configured.Concat(discovered.Where(x => x.Enabled))
            .GroupBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
            .Select(x => x.First())
            // Synchronize the compact, high-value identity/FAQ sources before
            // large content tables so useful answers are available immediately.
            .OrderBy(SourcePriority)
            .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        foreach (var source in result) Validate(source);
        return result;
    }

    public int PollSeconds(KnowledgeSourceOptions source) =>
        Math.Max(1, source.PollSeconds ?? options.PollSeconds);

    private static int SourcePriority(KnowledgeSourceOptions source) => source.Name switch
    {
        "phase1-organization-person" => 0,
        "phase1-faq" => 1,
        "phase1-tse-faq" => 2,
        "phase1-company-state" => 3,
        "phase1-download" => 4,
        "phase1-content" => 5,
        _ => 10
    };

    private static void Validate(KnowledgeSourceOptions source)
    {
        if (string.IsNullOrWhiteSpace(source.Name))
            throw new InvalidOperationException("Every knowledge source requires a stable Name.");
        if (string.IsNullOrWhiteSpace(source.SourceType))
            throw new InvalidOperationException($"Knowledge source '{source.Name}' requires SourceType.");
        if (source.SourceType.Length>100)
            throw new InvalidOperationException($"Knowledge source '{source.Name}' SourceType exceeds 100 characters.");
        if (source.CaptureMode is ChangeCaptureMode.ChangeTracking or ChangeCaptureMode.Cdc)
            throw new InvalidOperationException($"Knowledge source '{source.Name}' selected {source.CaptureMode}, which is not enabled in this deployment. Use Watermark until SQL Server CT/CDC is provisioned.");
        if (source.VectorizationPolicy == VectorizationPolicy.AllVersions && source.ChangeMode != IngestionChangeMode.SlowlyChangingDimension2)
            throw new InvalidOperationException($"Knowledge source '{source.Name}' can use AllVersions only with SlowlyChangingDimension2.");
        if (source.VectorizationPolicy == VectorizationPolicy.Never && source.ChangeMode == IngestionChangeMode.Tombstone)
            throw new InvalidOperationException($"Knowledge source '{source.Name}' cannot propagate tombstones when vectorization is disabled.");
    }
}
