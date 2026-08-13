namespace TSEAI.Knowledge.Worker;

public sealed class KnowledgeSyncWorker(
    SqlKnowledgeSourceReader reader,
    Phase1KnowledgeSourceDiscovery discovery,
    KnowledgeSourceRegistry registry,
    IKnowledgeCheckpointStore checkpoints,
    KnowledgeEntityEnricher enricher,
    KnowledgeIndexerClient indexer,
    ILogger<KnowledgeSyncWorker> logger) : BackgroundService
{
    private readonly Dictionary<string,DateTimeOffset> _nextRuns=new(StringComparer.OrdinalIgnoreCase);
    private IReadOnlyList<KnowledgeSourceOptions> _cachedSources=[];
    private DateTimeOffset _nextRegistryRefresh=DateTimeOffset.MinValue;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if(DateTimeOffset.UtcNow>=_nextRegistryRefresh)
            {
                try
                {
                    var autoSources=await discovery.DiscoverAsync(stoppingToken);
                    _cachedSources=registry.Build(autoSources);
                    _nextRegistryRefresh=DateTimeOffset.UtcNow.AddMinutes(1);
                }
                catch(Exception ex)
                {
                    logger.LogError(ex,"Knowledge source discovery/registry refresh failed; last valid registry remains active.");
                    _nextRegistryRefresh=DateTimeOffset.UtcNow.AddSeconds(30);
                }
            }

            foreach (var source in _cachedSources)
            {
                var now=DateTimeOffset.UtcNow;
                if (_nextRuns.TryGetValue(source.Name,out var nextRun) && nextRun>now) continue;
                _nextRuns[source.Name]=now.AddSeconds(registry.PollSeconds(source));
                try
                {
                    if(source.VectorizationPolicy==VectorizationPolicy.Never)
                    {
                        logger.LogInformation("Knowledge source {Source} is registered as structured-only; vector ingestion skipped.",source.Name);
                        continue;
                    }
                    var checkpoint=await checkpoints.LoadAsync(source.Name);
                    var reconciliationDue=source.CaptureMode==ChangeCaptureMode.FullReconciliation ||
                        (source.ReconciliationSeconds is > 0 &&
                         (checkpoint?.LastReconciliationUtc is null || checkpoint.LastReconciliationUtc.Value.AddSeconds(source.ReconciliationSeconds.Value)<=now));
                    var readCheckpoint=reconciliationDue ? null : checkpoint;
                    IngestionCheckpoint? candidate=checkpoint; var count=0; var batches=0;
                    await foreach(var batch in reader.ReadBatchesAsync(source,readCheckpoint,stoppingToken))
                    {
                        await enricher.EnrichAsync(batch.Documents,stoppingToken);
                        await indexer.IndexAsync(batch.Documents,stoppingToken);
                        count+=batch.Documents.Count; batches++;
                        if(batch.MaxCheckpoint is not null && (candidate is null || IngestionCheckpoint.Compare(batch.MaxCheckpoint,candidate)>0))
                            candidate=batch.MaxCheckpoint;
                    }
                    candidate ??= new IngestionCheckpoint(
                        new DateTimeOffset(1753,1,1,0,0,0,TimeSpan.Zero),"",DateTimeOffset.UtcNow);
                    if(candidate is not null)
                    {
                        candidate=candidate with
                        {
                            LastSuccessfulRunUtc=DateTimeOffset.UtcNow,
                            LastReconciliationUtc=reconciliationDue ? DateTimeOffset.UtcNow : checkpoint?.LastReconciliationUtc
                        };
                        await checkpoints.SaveAsync(source.Name,candidate);
                    }
                    logger.LogInformation("Knowledge source {Source}: synchronized {Count} documents in {Batches} batches; checkpoint={Checkpoint}; reconciliation={Reconciliation}",source.Name,count,batches,candidate,reconciliationDue);
                }
                catch (Exception ex) { logger.LogError(ex, "Knowledge sync failed for {Source}", source.Name); }
            }
            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }
    }
}
