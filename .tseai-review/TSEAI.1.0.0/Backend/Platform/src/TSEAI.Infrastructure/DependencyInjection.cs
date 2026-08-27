using TSEAI.Application.Admin;
using TSEAI.Application.Filters.ChatAssets;
using TSEAI.Application.Filters.Temporal;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using StackExchange.Redis;
using TSEAI.Application.Alerts;
using TSEAI.Application.Analytics;
using TSEAI.Application.Chat;
using TSEAI.Application.Chat.Routing;
using TSEAI.Application.Chat.Context;
using TSEAI.Application.Data.Canonical;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Entities;
using TSEAI.Application.Chat.Agentic;
using TSEAI.Application.Filters.Compatibility;
using TSEAI.Application.Filters.Chat;
using TSEAI.Application.Filters.Conversation;
using TSEAI.Application.Filters.Execution;
using TSEAI.Application.Filters.NaturalLanguage;
using TSEAI.Application.Filters.Saved;
using TSEAI.Application.Market;
using TSEAI.Application.Operations;
using TSEAI.Application.Temporal;
using TSEAI.Application.Usage;
using TSEAI.Application.Performance;
using TSEAI.Application.Security;
using TSEAI.Infrastructure.AI;
using TSEAI.Infrastructure.Alerts;
using TSEAI.Infrastructure.Chat;
using TSEAI.Infrastructure.Conversation;
using TSEAI.Infrastructure.Data.Canonical;
using TSEAI.Infrastructure.DataQuality;
using TSEAI.Infrastructure.Entities;
using TSEAI.Infrastructure.Filters;
using TSEAI.Infrastructure.Market;
using TSEAI.Infrastructure.Mcp;
using TSEAI.Infrastructure.Operations;
using TSEAI.Infrastructure.Persistence;
using TSEAI.Infrastructure.Settings;
using TSEAI.Infrastructure.Usage;
using TSEAI.Infrastructure.Health;
using TSEAI.Application.Tools;
using TSEAI.Application.StructuredQuery;
using TSEAI.Infrastructure.Tools;
using TSEAI.Shared.Application;

namespace TSEAI.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddTseaiInfrastructure(this IServiceCollection services, IConfiguration cfg)
    {
        services.AddMemoryCache();
        services.AddDbContext<ApplicationDbContext>(o => o.UseSqlServer(cfg.GetConnectionString("ApplicationDb")));
        services.AddStackExchangeRedisCache(o => o.Configuration = cfg["Redis:ConnectionString"]);
        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(cfg["Redis:ConnectionString"] ?? "redis:6379"));
        services.AddScoped<ISystemSettingService, SystemSettingService>();
        services.AddScoped<ISemanticRegistryService, SemanticRegistryService>();
        services.AddScoped<IMarketSnapshotQuery, RedisMarketSnapshotQuery>();
        services.AddScoped<ICanonicalDataGateway, SqlAiCanonicalDataGateway>();
        services.AddScoped<IDataQualityService, DataQualityService>();
        services.AddScoped<IMarketRuntimeStatusService, MarketRuntimeStatusService>();
        services.AddSingleton<IMarketAnalyticsEngine, DeterministicMarketAnalyticsEngine>();
        services.AddScoped<IStructuredToolGateway, SecureStructuredToolGateway>();
        services.AddSingleton<INaturalLanguageStructuredQueryInterpreter, PersianNaturalLanguageStructuredQueryInterpreter>();
        services.AddScoped<IStructuredQueryService, StructuredQueryService>();
        services.AddScoped<IEntityCandidateSource, SqlAiEntityCandidateSource>();
        services.AddScoped<IPersianEntityResolver, PersianEntityResolver>();
        services.AddSingleton<IClock, SystemClock>();
        services.AddScoped<IPersianTemporalResolver, PersianTemporalResolver>();
        services.AddScoped<FilterExecutionService>();
        services.AddScoped<TsetmcCompatibilityService>();
        services.AddSingleton<TsetmcConformanceService>();
        services.AddScoped<NaturalLanguageFilterService>();
        services.AddSingleton<IChatFilterIntentDetector, DeterministicChatFilterIntentDetector>();
        services.AddSingleton<IFilterTemporalPolicy, DeterministicFilterTemporalPolicy>();
        services.AddScoped<ChatIntegratedFilterService>();
        services.AddScoped<ConversationFilterService>();
        services.AddScoped<IConversationFilterStateStore, RedisConversationFilterStateStore>();
        services.AddScoped<IConversationFilterLock, RedisConversationFilterLock>();
        services.AddScoped<ISavedFilterRepository, EfSavedFilterRepository>();
        services.AddScoped<SavedFilterService>();
        services.AddSingleton<IChatFilterAssetCommandDetector, DeterministicChatFilterAssetCommandDetector>();
        services.AddScoped<ChatFilterAssetService>();
        services.AddScoped<IAlertRepository, EfAlertRepository>();
        services.AddScoped<AlertRuleService>();
        services.AddScoped<IConversationContextStore, RedisConversationContextStore>();
        services.AddHttpClient<IConversationQueryRewriter, HttpAiConversationQueryRewriter>(c => { c.BaseAddress = new Uri(cfg["AI:BaseUrl"] ?? "http://ai-engine:8000/"); c.Timeout=TimeSpan.FromSeconds(12); });
        services.AddScoped<IConversationContextService, ConversationContextService>();
        services.AddScoped<IConversationTemporalContextResolver, ConversationTemporalContextResolver>();
        services.AddScoped<IChatCapabilityRouter, DeterministicCapabilityRouter>();
        services.AddSingleton<IMultiToolHybridPlanner, DeterministicMultiToolHybridPlanner>();
        services.AddSingleton<IChatEvidenceEngine, ChatEvidenceEngine>();
        services.AddSingleton<IAnswerValidationGuard, DeterministicAnswerValidationGuard>();
        services.AddSingleton<IPersianFinancialAnswerComposer, PersianFinancialAnswerComposer>();
        services.AddScoped<ChatOrchestrator>();
        services.AddSingleton<IChatToolPolicy, ChatToolPolicy>();
        services.AddHttpClient<IChatReflector, HttpAiChatReflector>(c => { c.BaseAddress = new Uri(cfg["AI:BaseUrl"] ?? "http://ai-engine:8000/"); c.Timeout=TimeSpan.FromSeconds(30); });
        services.AddHttpClient<IChatAnswerSynthesizer, HttpAiGroundedAnswerSynthesizer>(c => { c.BaseAddress = new Uri(cfg["AI:BaseUrl"] ?? "http://ai-engine:8000/"); c.Timeout=TimeSpan.FromSeconds(45); });
        services.AddHttpClient("ai-health", c => { c.BaseAddress = new Uri(cfg["AI:BaseUrl"] ?? "http://ai-engine:8000/"); c.Timeout=TimeSpan.FromSeconds(3); });
        services.AddHttpClient("mcp", c => c.Timeout = TimeSpan.FromSeconds(15));
        services.AddScoped<IMcpToolGateway, HttpMcpToolGateway>();
        services.AddHttpClient<IAiChatPlanner, HttpAiChatPlanner>(c => { c.BaseAddress = new Uri(cfg["AI:BaseUrl"] ?? "http://ai-engine:8000/"); c.Timeout=TimeSpan.FromSeconds(Math.Clamp(cfg.GetValue("AI:PlannerTimeoutSeconds",15),5,60)); });
        services.AddSingleton<IPerformanceTelemetry, InMemoryPerformanceTelemetry>();
        services.AddSingleton<IAgenticSecurityGuard, DeterministicAgenticSecurityGuard>();
        services.AddHttpClient<HttpKnowledgeRetriever>(c => { c.BaseAddress = new Uri(cfg["AI:BaseUrl"] ?? "http://ai-engine:8000/"); c.Timeout=TimeSpan.FromSeconds(12); });
        services.AddScoped<IKnowledgeRetriever, CachedKnowledgeRetriever>();
        services.AddScoped<ICanonicalReferenceAnswerService, SqlAiCanonicalReferenceAnswerService>();
        services.AddHttpClient<IAiFilterPlanner, HttpAiFilterPlanner>(c => { c.BaseAddress = new Uri(cfg["AI:BaseUrl"] ?? "http://ai-engine:8000/"); c.Timeout=TimeSpan.FromSeconds(8); });
        services.AddHttpClient<IAiConversationFilterPlanner, HttpAiConversationFilterPlanner>(c => { c.BaseAddress = new Uri(cfg["AI:BaseUrl"] ?? "http://ai-engine:8000/"); c.Timeout=TimeSpan.FromSeconds(8); });
        services.AddScoped<IQuestionQuotaService, RedisQuestionQuotaService>();
        services.AddScoped<IOperationsStore, SqlOperationsStore>();
        services.AddSingleton<OperationsSchemaInitializer>();
        services.AddSingleton<ReleaseMigrationRunner>();
        services.AddHealthChecks().AddCheck<PlatformReadinessHealthCheck>("platform-dependencies", tags: ["ready"]);
        return services;
    }

    public static async Task SeedSettingsAsync(IServiceProvider services, CancellationToken ct = default)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var env = services.GetRequiredService<IHostEnvironment>();
        if (env.IsProduction())
            await services.GetRequiredService<ReleaseMigrationRunner>().ApplyAsync(services, ct);
        else
        {
            await db.Database.EnsureCreatedAsync(ct);
            await SavedFilterSchemaInitializer.EnsureAsync(db, ct);
            await AlertSchemaInitializer.EnsureAsync(db, ct);
            await services.GetRequiredService<OperationsSchemaInitializer>().InitializeAsync(ct);
        }
        var svc = services.GetRequiredService<ISystemSettingService>();

        async Task Ensure(string key, string value, string type, string title, string category)
        {
            if (!await db.SystemSettings.AnyAsync(x => x.Key == key, ct))
                await svc.SetAsync(key, value, type, title, null, category, ct);
        }

        await Ensure(TSEAI.Domain.Settings.SettingKeys.AnonymousDailyQuestionLimit, "5", "int", "سقف روزانه سوال مهمان", "AI");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.AuthenticatedDailyQuestionLimit, "50", "int", "سقف روزانه سوال کاربر", "AI");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.MaxSavedFiltersPerUser, "50", "int", "حداکثر فیلتر ذخیره‌شده هر کاربر", "Filters");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.MaxAlertsPerUser, "20", "int", "حداکثر هشدار فعال هر کاربر", "Alerts");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.AlertDefaultCooldownSeconds, "300", "int", "Cooldown پیش‌فرض هشدار (ثانیه)", "Alerts");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.AlertMaxCooldownSeconds, "86400", "int", "حداکثر Cooldown هشدار (ثانیه)", "Alerts");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.AlertRuleRefreshSeconds, "5", "int", "فاصله Refresh قوانین هشدار", "Alerts");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.MarketIsEnabled, "true", "bool", "فعال بودن بازار", "Market");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.MarketStartTime, "08:30", "time", "شروع بازار", "Market");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.MarketEndTime, "12:30", "time", "پایان بازار", "Market");
        await Ensure(TSEAI.Domain.Settings.SettingKeys.MarketPollingIntervalMs, "1000", "int", "فاصله Poll بازار", "Market");
    }
}
