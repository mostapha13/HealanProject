using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using NegareshAI.Api.Application;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Services;
using NegareshAI.Api.Application.ContractOperations;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NegareshAI.Api.Data.NegareshDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("NegareshAI")));
builder.Services.AddApplication();
builder.Services.AddHostedService<ContractOperationReminderWorker>();

builder.Services.AddControllers();
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHttpClient<IFileManagerClient, FileManagerClient>((services, client) =>
    client.BaseAddress = new Uri(services.GetRequiredService<IConfiguration>()["FileManager:BaseUrl"] ?? "http://localhost:5000/"));
builder.Services.AddHttpClient<IAiDocumentProcessor, AiDocumentProcessor>((services, client) =>
    client.BaseAddress = new Uri(services.GetRequiredService<IConfiguration>()["Ai:BaseUrl"] ?? "http://localhost:8000/"));
builder.Services.AddHttpClient<IComparisonReportGenerator, ComparisonReportGenerator>((services, client) =>
    client.BaseAddress = new Uri(services.GetRequiredService<IConfiguration>()["Ai:BaseUrl"] ?? "http://localhost:8000/"));
builder.Services.AddHttpClient<IContractDocumentGenerator, ContractDocumentGenerator>((services, client) =>
    client.BaseAddress = new Uri(services.GetRequiredService<IConfiguration>()["Ai:BaseUrl"] ?? "http://localhost:8000/"));
builder.Services.AddHttpClient("IdentityUserManager", (services, client) =>
    client.BaseAddress = new Uri(services.GetRequiredService<IConfiguration>()["Identity:UserManagerBaseUrl"] ?? "http://localhost:5074/"));
var authority = builder.Configuration["Authentication:Authority"];
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.Authority = authority;
    options.RequireHttpsMetadata = builder.Environment.IsProduction();
    options.TokenValidationParameters.ValidateAudience = false;
});
builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
await ApplyMigrationsAsync(app);
await EnsureRequiredInfrastructureDataAsync(app);
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (TenantResolutionException exception)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new
        {
            title = "Organization context is required.",
            detail = exception.Message
        });
    }
});
app.UseAuthorization();
app.UseMiddleware<NegareshAI.Api.Security.NegareshAccessMiddleware>();
app.MapGet("/health", () => Results.Ok(new { service = "negareshai-api", status = "healthy" }));
app.MapControllers();
app.Run();

static async Task ApplyMigrationsAsync(WebApplication app)
{
    const int maxAttempts = 10;
    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await using var scope = app.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<NegareshAI.Api.Data.NegareshDbContext>();
            await db.Database.MigrateAsync();
            return;
        }
        catch (Exception exception) when (attempt < maxAttempts)
        {
            app.Logger.LogWarning(exception,
                "Database migration attempt {Attempt}/{MaxAttempts} failed; retrying in 5 seconds.",
                attempt, maxAttempts);
            await Task.Delay(TimeSpan.FromSeconds(5));
        }
    }
}

static async Task EnsureRequiredInfrastructureDataAsync(WebApplication app)
{
    var organizationValue = app.Configuration["Tenancy:DevelopmentOrganizationId"]
        ?? "11111111-1111-1111-1111-111111111111";
    if (!Guid.TryParse(organizationValue, out var organizationId)) return;

    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<NegareshAI.Api.Data.NegareshDbContext>();
    if (!await db.Organizations.AnyAsync(item => item.Id == organizationId))
    {
        db.Organizations.Add(new NegareshAI.Api.Data.Organization
        {
            Id = organizationId,
            Name = "NegareshAI Development Organization",
            CreatedAtUtc = DateTime.UnixEpoch
        });
    }
    var exists = await db.RuntimeSettings.AnyAsync(item =>
        item.OrganizationId == organizationId && item.Category == "ai"
        && item.Key == "embedding.model" && item.IsActive);
    if (!exists)
    {
        db.RuntimeSettings.Add(new NegareshAI.Api.Data.RuntimeSetting
        {
            OrganizationId = organizationId,
            Category = "ai",
            Key = "embedding.model",
            ValueJson = """{"modelId":"BAAI/bge-m3","retrievalMode":"hybrid","normalizePersianDigits":true,"numericExactBoost":0.5}""",
            UpdatedByUserId = "system-bootstrap"
        });
    }
    await db.SaveChangesAsync();
    app.Logger.LogInformation("Required infrastructure data is available for organization {OrganizationId}.", organizationId);
}
