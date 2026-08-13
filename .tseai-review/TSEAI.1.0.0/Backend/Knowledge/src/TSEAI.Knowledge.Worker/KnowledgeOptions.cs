namespace TSEAI.Knowledge.Worker;

public sealed class KnowledgeOptions
{
    public string ConnectionString { get; set; } = "";
    public string RedisConnectionString { get; set; } = "redis:6379,abortConnect=false";
    public string CheckpointKeyPrefix { get; set; } = "tseai:knowledge:checkpoint:v1";
    public string AiBaseUrl { get; set; } = "http://ai-engine:8000";
    public int PollSeconds { get; set; } = 120;
    public int BatchSize { get; set; } = 250;
    public int MaxDocumentsPerSourceRun { get; set; } = 100000;
    public int WatermarkOverlapMinutes { get; set; } = 5;
    public int AiRequestTimeoutSeconds { get; set; } = 300;
    public bool EnablePhase1AutoSources { get; set; } = true;
    public List<KnowledgeSourceOptions> Sources { get; set; } = [];
}

public sealed class KnowledgeSourceOptions
{
    public string Name { get; set; } = "";
    public string SourceType { get; set; } = "";
    public string Query { get; set; } = "";
    public bool Enabled { get; set; } = true;
    public bool SupportsSince { get; set; }
    public int? PollSeconds { get; set; }
    public int? ReconciliationSeconds { get; set; } = 86400;
    public int? FreshnessSlaSeconds { get; set; }
    public ChangeCaptureMode CaptureMode { get; set; } = ChangeCaptureMode.Watermark;
    public IngestionChangeMode ChangeMode { get; set; } = IngestionChangeMode.Upsert;
    public VectorizationPolicy VectorizationPolicy { get; set; } = VectorizationPolicy.ChangedTextOnly;
}

public enum ChangeCaptureMode { Watermark, ChangeTracking, Cdc, FullReconciliation }
public enum IngestionChangeMode { Snapshot, Upsert, Append, SlowlyChangingDimension2, Tombstone }
public enum VectorizationPolicy { Never, NewOnly, ChangedTextOnly, CurrentProjection, AllVersions }
