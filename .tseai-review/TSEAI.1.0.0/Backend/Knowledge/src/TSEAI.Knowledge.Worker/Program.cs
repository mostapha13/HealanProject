using TSEAI.Knowledge.Worker;
using StackExchange.Redis;

var builder=Host.CreateApplicationBuilder(args);
var options=new KnowledgeOptions();
builder.Configuration.GetSection("Knowledge").Bind(options);
builder.Services.AddSingleton(options);
builder.Services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(options.RedisConnectionString));
builder.Services.AddSingleton<IKnowledgeCheckpointStore,RedisKnowledgeCheckpointStore>();
builder.Services.AddSingleton<KnowledgeSourceRegistry>();
builder.Services.AddSingleton<SqlKnowledgeSourceReader>();
builder.Services.AddSingleton<Phase1KnowledgeSourceDiscovery>();
builder.Services.AddSingleton<KnowledgeEntityEnricher>();
builder.Services.AddHttpClient<KnowledgeIndexerClient>(c =>
{
    c.BaseAddress=new Uri(options.AiBaseUrl.TrimEnd('/')+"/");
    c.Timeout=TimeSpan.FromSeconds(Math.Clamp(options.AiRequestTimeoutSeconds,30,900));
});
builder.Services.AddHostedService<KnowledgeSyncWorker>();
await builder.Build().RunAsync();
