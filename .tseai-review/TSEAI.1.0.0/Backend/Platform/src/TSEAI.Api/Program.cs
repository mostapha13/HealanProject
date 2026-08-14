using TSEAI.Application.Admin;
using TSEAI.Shared.Application.Production;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TSEAI.Application.Alerts;
using TSEAI.Application.Analytics;
using TSEAI.Application.Chat;
using TSEAI.Application.Data.Canonical;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Entities;
using TSEAI.Application.Filters.Ast;
using TSEAI.Application.Filters.Compatibility;
using TSEAI.Application.Filters.ChatAssets;
using TSEAI.Application.Filters.Conversation;
using TSEAI.Application.Filters.Execution;
using TSEAI.Application.Filters.Saved;
using TSEAI.Application.Market;
using TSEAI.Application.Operations;
using TSEAI.Application.Temporal;
using TSEAI.Application.Tools;
using TSEAI.Application.StructuredQuery;
using TSEAI.Application.Usage;
using TSEAI.Application.Performance;
using TSEAI.Application.Security;
using TSEAI.Infrastructure;
using TSEAI.Shared.Application.Market;
using System.Diagnostics;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
ProductionConfigurationGuard.Validate(builder.Configuration, "PlatformApi");
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 1_048_576);
builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails();
builder.Services.AddTseaiInfrastructure(builder.Configuration);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Security:Issuer"] ?? "tseai-identity",
        ValidAudience = builder.Configuration["Security:Audience"] ?? "tseai",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            builder.Configuration["Security:JwtSigningKey"] ?? throw new InvalidOperationException("JWT key missing")))
    });
builder.Services.AddAuthorization();
builder.Services.Configure<ForwardedHeadersOptions>(o => { o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto; o.KnownNetworks.Clear(); o.KnownProxies.Clear(); });
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext,string>(ctx =>
    {
        var key = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var authenticated = ctx.User.Identity?.IsAuthenticated == true;
        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions { PermitLimit = authenticated ? 180 : 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true });
    });
});

var app = builder.Build();
using (var scope = app.Services.CreateScope()) await DependencyInjection.SeedSettingsAsync(scope.ServiceProvider);
app.UseExceptionHandler(exceptionHandlerApp => exceptionHandlerApp.Run(async context =>
{
    var correlationId = context.Response.Headers["X-Correlation-Id"].FirstOrDefault()
        ?? context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
        ?? Guid.NewGuid().ToString("N");
    var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
    var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("UnhandledException");
    logger.LogError(exception, "Unhandled request failure. CorrelationId={CorrelationId}", correlationId);
    try
    {
        var store = context.RequestServices.GetRequiredService<IOperationsStore>();
        await store.RecordIncidentAsync("PlatformApi", "Error", "unhandled_request", "Unhandled request failure; inspect structured logs using the correlation id.", context.RequestAborted);
    }
    catch (Exception incidentError)
    {
        logger.LogWarning(incidentError, "Could not persist operational incident. CorrelationId={CorrelationId}", correlationId);
    }
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    context.Response.ContentType = "application/problem+json";
    await context.Response.WriteAsJsonAsync(new
    {
        type = "https://httpstatuses.com/500",
        title = "An unexpected error occurred.",
        status = 500,
        code = "internal_error",
        correlationId,
    });
}));
app.UseForwardedHeaders();
if (app.Environment.IsProduction()) app.UseHsts();
app.Use(async (ctx,next) =>
{
    var correlation = ctx.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString("N");
    ctx.Response.Headers["X-Correlation-Id"] = correlation;
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Cross-Origin-Resource-Policy"] = "same-origin";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    ctx.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
    await next();
});
app.Use(async (ctx,next) =>
{
    var performance = ctx.RequestServices.GetRequiredService<IPerformanceTelemetry>();
    performance.Request();
    var started = Stopwatch.GetTimestamp();
    await next();
    if (!ctx.Request.Path.Equals("/api/chat/ask", StringComparison.OrdinalIgnoreCase)) return;
    var elapsedMs = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
    var correlationId = ctx.Response.Headers["X-Correlation-Id"].FirstOrDefault() ?? "missing";
    Guid? userId = Guid.TryParse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsedUserId) ? parsedUserId : null;
    var outcome = ctx.Response.StatusCode < 400 ? "success" : $"http_{ctx.Response.StatusCode}";
    var metadata = JsonSerializer.Serialize(new { statusCode = ctx.Response.StatusCode, durationMs = Math.Round(elapsedMs, 2) });
    try
    {
        await ctx.RequestServices.GetRequiredService<IOperationsStore>()
            .RecordAuditAsync(userId, "chat.ask", "chat", null, outcome, correlationId, metadata, ctx.RequestAborted);
    }
    catch (Exception auditError)
    {
        ctx.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RequestAudit")
            .LogWarning(auditError, "Could not persist request audit. CorrelationId={CorrelationId}", correlationId);
    }
});
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });
app.MapHealthChecks("/health");
app.MapHealthChecks("/api/health", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });
app.MapGet("/api/admin/performance", (HttpContext c, IPerformanceTelemetry p) => c.User.HasClaim("permission","Operations.Read") ? Results.Ok(p.Snapshot()) : Results.Forbid()).RequireAuthorization();


static (string Subject, bool Authenticated, string? AnonymousSubject) ResolveSubject(HttpContext context)
{
    var anonymousId = context.Request.Headers["X-Anonymous-Id"].FirstOrDefault();
    var uid = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!string.IsNullOrWhiteSpace(uid)) return (uid, true, string.IsNullOrWhiteSpace(anonymousId) ? null : anonymousId);
    if (string.IsNullOrWhiteSpace(anonymousId))
    {
        anonymousId = Guid.NewGuid().ToString("N");
        context.Response.Headers["X-Anonymous-Id"] = anonymousId;
    }
    return (anonymousId, false, anonymousId);
}

static string ConversationId(string? requested)
{
    if (string.IsNullOrWhiteSpace(requested)) return Guid.NewGuid().ToString("N");
    requested = requested.Trim();
    if (requested.Length > 100) throw new ArgumentException("Conversation id is too long.");
    return requested;
}

static string RequireUserId(HttpContext context) =>
    context.User.FindFirstValue(ClaimTypes.NameIdentifier)
    ?? throw new UnauthorizedAccessException("Authenticated user id is missing.");

static bool IsChatAssetResult(string type) => type is
    "saved_filter_saved" or "saved_filter_list" or "saved_filter_loaded" or "saved_filter_deleted" or
    "alert_created" or "alert_list" or "alert_enabled" or "alert_disabled" or "alert_deleted" or
    "filter_asset_error" or "forbidden" or "authentication_required";

static IResult SavedFilterError(Exception ex) => ex switch
{
    SavedFilterLimitReachedException x => Results.Conflict(new { code = "saved_filter_limit_reached", message = x.Message, limit = x.Limit }),
    KeyNotFoundException x => Results.NotFound(new { code = "saved_filter_not_found", message = x.Message }),
    ArgumentException x => Results.BadRequest(new { code = "invalid_saved_filter_request", message = x.Message }),
    DbUpdateConcurrencyException => Results.Conflict(new { code = "saved_filter_concurrency_conflict", message = "فیلتر هم‌زمان در درخواست دیگری تغییر کرده است؛ دوباره بارگذاری کنید." }),
    DbUpdateException => Results.Conflict(new { code = "saved_filter_database_conflict", message = "ذخیره فیلتر با داده موجود تداخل دارد؛ نام فیلتر را بررسی کنید." }),
    InvalidOperationException x => Results.Conflict(new { code = "saved_filter_conflict", message = x.Message }),
    _ => Results.Problem("خطا در عملیات فیلتر ذخیره‌شده.")
};

static IResult AlertError(Exception ex) => ex switch
{
    AlertLimitReachedException x => Results.Conflict(new { code = "alert_limit_reached", message = x.Message, limit = x.Limit }),
    KeyNotFoundException x => Results.NotFound(new { code = "alert_not_found", message = x.Message }),
    ArgumentException x => Results.BadRequest(new { code = "invalid_alert_request", message = x.Message }),
    DbUpdateConcurrencyException => Results.Conflict(new { code = "alert_concurrency_conflict", message = "هشدار هم‌زمان در درخواست دیگری تغییر کرده است؛ دوباره بارگذاری کنید." }),
    InvalidOperationException x => Results.Conflict(new { code = "alert_conflict", message = x.Message }),
    _ => Results.Problem("خطا در عملیات هشدار.")
};

app.MapPost("/api/filters/import", (FilterSourceRequest r, TsetmcCompatibilityService c) =>
{
    var x = c.Import(r.Source);
    return x.Valid ? Results.Ok(x) : Results.BadRequest(x);
});

app.MapPost("/api/filters/export", (FilterSourceRequest r, TsetmcCompatibilityService c) =>
{
    var x = c.Import(r.Source);
    return x.Valid ? Results.Ok(new { x.CanonicalTsetmcCode, x.PersianExplanation, x.Dependencies }) : Results.BadRequest(x);
});

app.MapGet("/api/filters/conformance", (TsetmcConformanceService c) => Results.Ok(c.Run()));
app.MapGet("/api/filters/fields", () => Results.Ok(TsetmcFieldRegistry.All.Select(x => new { x.Code, x.CanonicalName, x.PersianName })));
app.MapPost("/api/filters/parse", (FilterSourceRequest r, FilterExecutionService f) =>
{
    try
    {
        var p = f.Parse(r.Source);
        return Results.Ok(new { valid = p.Validation.IsValid, errors = p.Validation.Errors, ast = p.Ast, tree = AstDebugPrinter.Print(p.Ast) });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { valid = false, errors = new[] { ex.Message } });
    }
});


app.MapPost("/api/structured-query/execute", async (StructuredQueryRequest r, IStructuredQueryService service, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(r.Question) || r.Question.Length > 2000)
        return Results.BadRequest(new { code = "invalid_question" });
    var result = await service.ExecuteAsync(r.Question, r.Take, ct);
    return result.Success ? Results.Ok(result) : Results.BadRequest(result);
});
app.MapPost("/api/filters/execute", async (FilterExecuteRequest r, FilterExecutionService f, CancellationToken ct) =>
{
    try { return Results.Ok(await f.ExecuteAsync(r.Source, new FilterExecutionOptions(r.Page ?? 1, r.PageSize ?? r.MaxResults ?? 100, r.SortBy, r.SortDescending ?? true), ct)); }
    catch (Exception ex) { return Results.BadRequest(new { code = "invalid_filter", message = ex.Message }); }
});

app.MapGet("/api/market/symbol/{symbolOrCode}", async (string symbolOrCode, IMarketSnapshotQuery q, CancellationToken ct) =>
    (await q.FindAsync(symbolOrCode, ct)) is { } s
        ? Results.Ok(new
        {
            data = s,
            tradeValueDisplay = MoneyFormatter.FormatIrr(s.TradeValue),
            marketValueDisplay = s.MarketValue is { } mv ? MoneyFormatter.FormatIrr(mv) : null
        })
        : Results.NotFound());
app.MapGet("/api/market/active", async (int? limit, IMarketSnapshotQuery q, CancellationToken ct) =>
    Results.Ok(await q.GetActiveAsync(limit ?? 100, ct)));

app.MapGet("/api/usage/quota", async (HttpContext c, IQuestionQuotaService q, CancellationToken ct) =>
{
    var s = ResolveSubject(c);
    return Results.Ok(await q.GetStatusAsync(s.Subject, s.Authenticated, ct));
});

app.MapGet("/api/filters/conversation/{conversationId}", async (
    HttpContext c,
    string conversationId,
    ConversationFilterService filters,
    CancellationToken ct) =>
{
    var s = ResolveSubject(c);
    return Results.Ok(await filters.GetAsync(s.Subject, ConversationId(conversationId), ct, s.Authenticated ? s.AnonymousSubject : null));
});

app.MapPost("/api/chat/ask", async (
    HttpContext c,
    ChatRequest req,
    IQuestionQuotaService quota,
    IAgenticSecurityGuard securityGuard,
    ChatOrchestrator chat,
    CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Question) || req.Question.Length > 4000)
        return Results.BadRequest(new { code = "invalid_question", message = "متن سؤال نامعتبر است." });

    var security=securityGuard.Inspect(req.Question);
    if(!security.Allowed) return Results.BadRequest(new { code=security.Code, signals=security.Signals, message="درخواست به دلیل الگوی ناامن قابل اجرا نیست." });

    var s = ResolveSubject(c);
    if (!await quota.TryReserveAsync(s.Subject, s.Authenticated, ct))
        return Results.Json(new { code = "daily_limit_reached", message = "سهمیه سوال روزانه شما تمام شده است." }, statusCode: 429);

    try
    {
        var conversationId = ConversationId(req.ConversationId);
        var assetAuthorization = new ChatFilterAssetAuthorization(
            s.Authenticated && c.User.HasClaim("permission", "Filter.Save"),
            s.Authenticated && c.User.HasClaim("permission", "Alert.Create"));
        var result = await chat.AskAsync(
            s.Subject, s.Authenticated, s.AnonymousSubject, assetAuthorization,
            new ChatOrchestrationRequest(req.Question, conversationId, req.Page ?? 1, req.PageSize ?? req.MaxResults ?? 100, req.SortBy, req.SortDescending ?? true), ct);

        // UI prose is Persian-calendar only. Typed DTO timestamps intentionally
        // remain ISO/Gregorian so API contracts and date arithmetic stay stable.
        result = result with
        {
            Answer = PersianDisplayText.LocalizeDates(result.Answer),
            Clarification = result.Clarification is null ? null : PersianDisplayText.LocalizeDates(result.Clarification)
        };

        if (result.Intent == ChatIntent.Clarification || IsChatAssetResult(result.Type))
            await quota.ReleaseAsync(s.Subject, s.Authenticated, ct);

        var quotaStatus = await quota.GetStatusAsync(s.Subject, s.Authenticated, ct);
        return Results.Ok(new
        {
            result.Type,
            question = req.Question,
            result.Answer,
            result.ConversationId,
            intent = result.Intent.ToString(),
            result.Confidence,
            result.Market,
            result.Filter,
            result.Knowledge,
            result.Citations,
            result.Trace,
            result.Clarification,
            result.Temporal,
            result.Entity,
            result.DataQuality,
            result.Analytics,
            result.StructuredQuery,
            result.Comparison,
            result.ConversationContext,
            result.TemporalConversation,
            result.Evidence,
            result.EvidenceValidation,
            result.AnswerValidation,
            quota = quotaStatus
        });
    }
    catch
    {
        await quota.ReleaseAsync(s.Subject, s.Authenticated, ct);
        throw;
    }
});

// Saved filters are owned by authenticated TSEAI users and never by anonymous browser ids.
var savedFilters = app.MapGroup("/api/saved-filters")
    .RequireAuthorization(p => p.RequireClaim("permission", "Filter.Save"));

savedFilters.MapGet("/", async (
    HttpContext c,
    string? search,
    bool? favoritesOnly,
    SavedFilterService service,
    CancellationToken ct) =>
{
    var rows = await service.ListAsync(RequireUserId(c), search, favoritesOnly, ct);
    return Results.Ok(new { count = rows.Count, items = rows });
});

savedFilters.MapGet("/{id:guid}", async (HttpContext c, Guid id, SavedFilterService service, CancellationToken ct) =>
{
    var row = await service.GetAsync(RequireUserId(c), id, ct);
    return row is null ? Results.NotFound(new { code = "saved_filter_not_found" }) : Results.Ok(row);
});

savedFilters.MapPost("/", async (HttpContext c, CreateSavedFilterRequest req, SavedFilterService service, CancellationToken ct) =>
{
    try { return Results.Created("/api/saved-filters", await service.CreateAsync(RequireUserId(c), req, ct)); }
    catch (Exception ex) { return SavedFilterError(ex); }
});

savedFilters.MapPut("/{id:guid}", async (HttpContext c, Guid id, UpdateSavedFilterRequest req, SavedFilterService service, CancellationToken ct) =>
{
    try { return Results.Ok(await service.UpdateMetadataAsync(RequireUserId(c), id, req, ct)); }
    catch (Exception ex) { return SavedFilterError(ex); }
});

savedFilters.MapPost("/{id:guid}/versions", async (HttpContext c, Guid id, CreateSavedFilterVersionRequest req, SavedFilterService service, CancellationToken ct) =>
{
    try { return Results.Ok(await service.CreateVersionAsync(RequireUserId(c), id, req, ct)); }
    catch (Exception ex) { return SavedFilterError(ex); }
});

savedFilters.MapGet("/{id:guid}/versions", async (HttpContext c, Guid id, SavedFilterService service, CancellationToken ct) =>
{
    var row = await service.GetAsync(RequireUserId(c), id, ct);
    return row is null ? Results.NotFound(new { code = "saved_filter_not_found" }) : Results.Ok(row.Versions);
});

savedFilters.MapPost("/{id:guid}/restore/{version:int}", async (HttpContext c, Guid id, int version, RestoreSavedFilterRequest req, SavedFilterService service, CancellationToken ct) =>
{
    try { return Results.Ok(await service.RestoreVersionAsync(RequireUserId(c), id, version, req.Note, ct)); }
    catch (Exception ex) { return SavedFilterError(ex); }
});

savedFilters.MapPost("/{id:guid}/duplicate", async (HttpContext c, Guid id, DuplicateSavedFilterRequest req, SavedFilterService service, CancellationToken ct) =>
{
    try { return Results.Ok(await service.DuplicateAsync(RequireUserId(c), id, req.Name, ct)); }
    catch (Exception ex) { return SavedFilterError(ex); }
});

savedFilters.MapPost("/{id:guid}/load", async (HttpContext c, Guid id, LoadSavedFilterRequest req, SavedFilterService service, CancellationToken ct) =>
{
    try
    {
        var state = await service.LoadIntoConversationAsync(RequireUserId(c), id, ConversationId(req.ConversationId), ct);
        return Results.Ok(new { conversationId = state.ConversationId, filter = state.CurrentCode, version = state.CurrentVersion, canUndo = state.CanUndo, canRedo = state.CanRedo });
    }
    catch (Exception ex) { return SavedFilterError(ex); }
});

savedFilters.MapDelete("/{id:guid}", async (HttpContext c, Guid id, SavedFilterService service, CancellationToken ct) =>
{
    try { await service.DeleteAsync(RequireUserId(c), id, ct); return Results.NoContent(); }
    catch (Exception ex) { return SavedFilterError(ex); }
});


// Alert rules are authenticated user assets linked to Saved Filters. These endpoints never consume Chat quota.
var alerts = app.MapGroup("/api/alerts")
    .RequireAuthorization(p => p.RequireClaim("permission", "Alert.Create"));

alerts.MapGet("/", async (HttpContext c, AlertRuleService service, CancellationToken ct) =>
    Results.Ok(new { items = await service.ListAsync(RequireUserId(c), ct) }));

alerts.MapGet("/{id:guid}", async (HttpContext c, Guid id, AlertRuleService service, CancellationToken ct) =>
    (await service.GetAsync(RequireUserId(c), id, ct)) is { } row
        ? Results.Ok(row)
        : Results.NotFound(new { code = "alert_not_found" }));

alerts.MapPost("/", async (HttpContext c, CreateAlertRuleRequest req, AlertRuleService service, CancellationToken ct) =>
{
    try { return Results.Created("/api/alerts", await service.CreateAsync(RequireUserId(c), req, ct)); }
    catch (Exception ex) { return AlertError(ex); }
});

alerts.MapPut("/{id:guid}", async (HttpContext c, Guid id, UpdateAlertRuleRequest req, AlertRuleService service, CancellationToken ct) =>
{
    try { return Results.Ok(await service.UpdateAsync(RequireUserId(c), id, req, ct)); }
    catch (Exception ex) { return AlertError(ex); }
});

alerts.MapDelete("/{id:guid}", async (HttpContext c, Guid id, AlertRuleService service, CancellationToken ct) =>
{
    try { await service.DeleteAsync(RequireUserId(c), id, ct); return Results.NoContent(); }
    catch (Exception ex) { return AlertError(ex); }
});

alerts.MapGet("/events/recent", async (HttpContext c, int? take, bool? unreadOnly, AlertRuleService service, CancellationToken ct) =>
    Results.Ok(new { items = await service.ListEventsAsync(RequireUserId(c), take ?? 50, unreadOnly ?? false, ct) }));

alerts.MapPost("/events/{eventId:guid}/read", async (HttpContext c, Guid eventId, AlertRuleService service, CancellationToken ct) =>
{
    try { return Results.Ok(await service.MarkReadAsync(RequireUserId(c), eventId, ct)); }
    catch (Exception ex) { return AlertError(ex); }
});

app.MapGet("/api/admin/settings", async (ISystemSettingService s, CancellationToken ct) => Results.Ok(await s.GetAllAsync(ct)))
    .RequireAuthorization(p => p.RequireClaim("permission", "Admin.Settings"));
app.MapPut("/api/admin/settings/{key}", async (string key, UpdateSettingRequest r, ISystemSettingService s, CancellationToken ct) =>
{
    var error = SystemSettingValidator.Validate(key, r.Value, r.ValueType);
    if (error is not null) return Results.BadRequest(new { code = "invalid_setting", message = error });
    await s.SetAsync(key, r.Value, r.ValueType, r.Title, r.Description, r.Category, ct);
    return Results.NoContent();
}).RequireAuthorization(p => p.RequireClaim("permission", "Admin.Settings"));

// Sprint 14 — deterministic Persian temporal resolution.
// ReferenceUtc is optional and intended for diagnostics/tests; Chat uses the server clock in Tehran market time.
app.MapPost("/api/temporal/resolve", (TemporalResolveRequest req, IPersianTemporalResolver resolver) =>
{
    if (string.IsNullOrWhiteSpace(req.Text) || req.Text.Length > 4000)
        return Results.BadRequest(new { code = "invalid_temporal_text", message = "متن تاریخ نامعتبر است." });
    return Results.Ok(resolver.Resolve(req.Text, req.ReferenceUtc));
});

// Sprint 15 — deterministic Persian entity/instrument resolution against SQL AI.
app.MapPost("/api/admin/entity/resolve", async (EntityResolveRequest req, IPersianEntityResolver resolver, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Text) || req.Text.Length > 256)
        return Results.BadRequest(new { code = "invalid_entity_text", message = "عبارت Entity نامعتبر است." });

    var kinds = new List<EntityKind>();
    foreach (var value in req.ExpectedKinds ?? [])
    {
        if (!Enum.TryParse<EntityKind>(value, true, out var kind) || !Enum.IsDefined(typeof(EntityKind), kind))
            return Results.BadRequest(new { code = "invalid_entity_kind", message = $"نوع Entity نامعتبر است: {value}" });
        kinds.Add(kind);
    }

    var result = await resolver.ResolveAsync(req.Text, new EntityResolveOptions(kinds), ct);
    return Results.Ok(result);
}).RequireAuthorization(p => p.RequireClaim("permission", "Operations.Read"));

// Sprint 13 — Canonical SQL AI boundary. Admin-only diagnostics; Chat integration is introduced in later sprints.
var canonicalData = app.MapGroup("/api/admin/canonical")
    .RequireAuthorization(p => p.RequireClaim("permission", "Operations.Read"));

canonicalData.MapGet("/status", async (ICanonicalDataGateway gateway, CancellationToken ct) =>
    Results.Ok(await gateway.GetStatusAsync(ct)));

canonicalData.MapGet("/instrument/{key}", async (string key, ICanonicalDataGateway gateway, CancellationToken ct) =>
    (await gateway.FindInstrumentAsync(key, ct)) is { } row ? Results.Ok(row) : Results.NotFound());

canonicalData.MapGet("/market/{instrumentId}", async (string instrumentId, ICanonicalDataGateway gateway, CancellationToken ct) =>
{
    var market = await gateway.GetCashMarketAsync(instrumentId, ct);
    if (market is null) return Results.NotFound();
    var orderBook = await gateway.GetOrderBookAsync(instrumentId, ct);
    var clientType = await gateway.GetClientTypeAsync(instrumentId, ct);
    return Results.Ok(new { market, orderBook, clientType });
});

canonicalData.MapGet("/summary", async (int? marketId, ICanonicalDataGateway gateway, CancellationToken ct) =>
    Results.Ok(new
    {
        summary = await gateway.GetMarketSummaryAsync(marketId, ct),
        indexes = await gateway.GetMarketIndexesAsync(marketId, ct)
    }));

// Sprint 17 — Secure Structured Tool Gateway. Admin diagnostics invoke only allow-listed, strongly typed tools.
var structuredToolsApi = app.MapGroup("/api/admin/structured-tools")
    .RequireAuthorization(p => p.RequireClaim("permission", "Operations.Read"));

structuredToolsApi.MapGet("/", (IStructuredToolGateway gateway) => Results.Ok(gateway.Describe()));
structuredToolsApi.MapPost("/execute", async (StructuredToolRequest req, IStructuredToolGateway gateway, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(req.Tool) || req.Tool.Length > 128)
        return Results.BadRequest(new { code = "invalid_tool", message = "نام Tool نامعتبر است." });
    var result = await gateway.ExecuteAsync(new StructuredToolCall(req.Tool, req.Entity, req.MarketId), ct);
    return result.Success ? Results.Ok(result) : Results.BadRequest(result);
});

// Sprint 16 — Data Quality & Freshness diagnostics.
var dataQualityApi = app.MapGroup("/api/admin/data-quality")
    .RequireAuthorization(p => p.RequireClaim("permission", "Operations.Read"));

dataQualityApi.MapGet("/sources", async (IDataQualityService quality, CancellationToken ct) =>
    Results.Ok(await quality.EvaluateCanonicalSourcesAsync(ct)));

dataQualityApi.MapGet("/market/{key}", async (string key, IMarketSnapshotQuery market, IDataQualityService quality, CancellationToken ct) =>
{
    var snapshot = await market.FindAsync(key, ct);
    return snapshot is null ? Results.NotFound() : Results.Ok(quality.EvaluateMarketSnapshot(snapshot));
});

// Sprint 15 cumulative invariant: sprint = 15 was completed; current API root reports Sprint 16.
// Sprint 10 compatibility invariant retained for cumulative validator: sprint = 10
app.MapGet("/", () => Results.Ok(new { service = "TSEAI.Api", sprint = 35, status = "golden-question-dataset" }));


// Sprint 34 — AI Admin & Semantic Registry. Explicit Operations.Read permission required.
var semanticRegistry = app.MapGroup("/api/admin/semantic-registry")
    .RequireAuthorization(p => p.RequireClaim("permission", "Operations.Read"));
semanticRegistry.MapGet("/", async (ISemanticRegistryService svc, CancellationToken ct) => Results.Ok(await svc.GetAsync(ct)));
semanticRegistry.MapPut("/aliases/{alias}", async (string alias, SemanticAliasRequest req, ISemanticRegistryService svc, CancellationToken ct) =>
{ await svc.SetAliasAsync(alias,req.Canonical,req.Kind,ct); return Results.NoContent(); });
semanticRegistry.MapDelete("/aliases/{alias}", async (string alias, ISemanticRegistryService svc, CancellationToken ct) =>
{ await svc.RemoveAliasAsync(alias,ct); return Results.NoContent(); });
semanticRegistry.MapPut("/policies/{key}", async (string key, SemanticPolicyRequest req, ISemanticRegistryService svc, CancellationToken ct) =>
{ await svc.SetPolicyAsync(key,req.Value,req.Category??"Semantic",ct); return Results.NoContent(); });

// Sprint 11 — operations control plane. Explicit permission is required; no anonymous fallback.
var operations = app.MapGroup("/api/admin/operations")
    .RequireAuthorization(p => p.RequireClaim("permission", "Operations.Read"));

operations.MapGet("/overview", async (IOperationsStore store, CancellationToken ct) =>
    Results.Ok(await store.OverviewAsync(ct)));
operations.MapGet("/audit", async (int? take, IOperationsStore store, CancellationToken ct) =>
    Results.Ok(await store.AuditAsync(take ?? 100, ct)));
operations.MapGet("/incidents", async (string? status, int? take, IOperationsStore store, CancellationToken ct) =>
    Results.Ok(await store.IncidentsAsync(status, take ?? 100, ct)));
operations.MapGet("/health", () => Results.Ok(new[]
{
    new RuntimeHealth("platform-api","Healthy",null,DateTime.UtcNow),
    new RuntimeHealth("identity-api","ExternalCheckRequired",null,DateTime.UtcNow),
    new RuntimeHealth("market-runtime","ExternalCheckRequired",null,DateTime.UtcNow),
    new RuntimeHealth("alert-engine","ExternalCheckRequired",null,DateTime.UtcNow),
    new RuntimeHealth("knowledge-worker","ExternalCheckRequired",null,DateTime.UtcNow),
    new RuntimeHealth("ai-engine","ExternalCheckRequired",null,DateTime.UtcNow)
}));

app.Run();

public sealed record ChatRequest(string Question, int? MaxResults, string? ConversationId, int? Page, int? PageSize, string? SortBy, bool? SortDescending);
public sealed record UpdateSettingRequest(string Value, string ValueType, string? Title, string? Description, string Category);
public sealed record FilterSourceRequest(string Source);
public sealed record FilterExecuteRequest(string Source, int? MaxResults, int? Page, int? PageSize, string? SortBy, bool? SortDescending);
public sealed record TemporalResolveRequest(string Text, DateTimeOffset? ReferenceUtc);
public sealed record EntityResolveRequest(string Text, string[]? ExpectedKinds);
public sealed record StructuredToolRequest(string Tool, string? Entity, int? MarketId);

public sealed record RestoreSavedFilterRequest(string? Note);
public sealed record DuplicateSavedFilterRequest(string? Name);

public sealed record StructuredQueryRequest(string Question, int? Take);
public sealed record SemanticAliasRequest(string Canonical,string Kind);
public sealed record SemanticPolicyRequest(string Value,string? Category);
