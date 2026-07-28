using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using NegareshAI.Api.Application;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NegareshAI.Api.Data.NegareshDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("NegareshAI")));
builder.Services.AddApplication();

builder.Services.AddControllers();
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHttpClient<IFileManagerClient, FileManagerClient>((services, client) =>
    client.BaseAddress = new Uri(services.GetRequiredService<IConfiguration>()["FileManager:BaseUrl"] ?? "http://localhost:5000/"));
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
