using TSEAI.Knowledge.Worker;

static void Ensure(bool condition,string message)
{
    if(!condition) throw new InvalidOperationException(message);
}

var at = new DateTimeOffset(2026,8,12,10,0,0,TimeSpan.Zero);
var a = new IngestionCheckpoint(at,"100",at);
var b = new IngestionCheckpoint(at,"101",at);
var c = new IngestionCheckpoint(at.AddSeconds(1),"001",at);
Ensure(IngestionCheckpoint.Compare(b,a)>0,"Compound checkpoint must use SourceId when timestamps are equal.");
Ensure(IngestionCheckpoint.Compare(c,b)>0,"Watermark must take precedence over SourceId.");

var options = new KnowledgeOptions { PollSeconds=120 };
var registry = new KnowledgeSourceRegistry(options);
var source = new KnowledgeSourceOptions
{
    Name="news", SourceType="news", Query="SELECT 1 AS SourceId, 't' AS Title, 'b' AS Body",
    PollSeconds=5, ChangeMode=IngestionChangeMode.Append, VectorizationPolicy=VectorizationPolicy.NewOnly
};
Ensure(registry.Build([source]).Count==1,"Valid source must be registered.");
Ensure(registry.PollSeconds(source)==5,"Per-source cadence must override the global cadence.");

var invalid = new KnowledgeSourceOptions
{
    Name="bad", SourceType="bad", Query="SELECT 1 AS SourceId, 't' AS Title, 'b' AS Body",
    ChangeMode=IngestionChangeMode.Upsert, VectorizationPolicy=VectorizationPolicy.AllVersions
};
try { registry.Build([invalid]); throw new InvalidOperationException("Invalid policy combination was accepted."); }
catch(InvalidOperationException ex) when(ex.Message.Contains("AllVersions",StringComparison.Ordinal)) { }

Console.WriteLine("TSEAI Knowledge ingestion policy smoke tests PASS");
