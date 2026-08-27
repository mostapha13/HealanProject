using StackExchange.Redis;
using TSEAI.MarketRuntime.Worker;

if (args.Contains("--health-check", StringComparer.OrdinalIgnoreCase))
{
    var configuration = new ConfigurationBuilder().AddEnvironmentVariables().Build();
    using var connection = await ConnectionMultiplexer.ConnectAsync(configuration["Redis:ConnectionString"] ?? "redis:6379");
    var result = await new RedisMarketSnapshotStore(connection).CheckHealthAsync();
    Console.WriteLine(result.Detail);
    Environment.ExitCode = result.Healthy ? 0 : 1;
    return;
}

var builder=Host.CreateApplicationBuilder(args);
builder.Services.Configure<MarketRuntimeOptions>(builder.Configuration.GetSection("Runtime"));
builder.Services.AddSingleton<IConnectionMultiplexer>(_=>ConnectionMultiplexer.Connect(builder.Configuration["Redis:ConnectionString"]??"redis:6379"));
builder.Services.AddSingleton<MarketDbReader>();
builder.Services.AddSingleton<RedisMarketSnapshotStore>();
builder.Services.AddSingleton<TradingSessionPolicy>();
builder.Services.AddHostedService<MarketRuntimeWorker>();
await builder.Build().RunAsync();
