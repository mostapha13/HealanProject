using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NegareshAI.Api.Data.NegareshDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("NegareshAI")));

builder.Services.AddControllers();
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
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok(new { service = "negareshai-api", status = "healthy" }));
app.MapControllers();
app.Run();
