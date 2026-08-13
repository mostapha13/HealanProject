using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using TSEAI.Alert.Worker;
using TSEAI.Infrastructure.Persistence;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.Configure<AlertEngineOptions>(builder.Configuration.GetSection("Alerts"));
builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("ApplicationDb")));
builder.Services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(builder.Configuration["Redis:ConnectionString"] ?? "redis:6379"));
builder.Services.AddSingleton<AlertRedisStore>();
builder.Services.AddSingleton<AlertRuleCache>();
builder.Services.AddSingleton<RabbitMqAlertPublisher>();
builder.Services.AddHostedService<AlertEvaluationWorker>();
builder.Services.AddHostedService<AlertOutboxPublisherWorker>();

var host = builder.Build();
using (var scope = host.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await AlertSchemaInitializer.EnsureAsync(db);
}
await host.RunAsync();
