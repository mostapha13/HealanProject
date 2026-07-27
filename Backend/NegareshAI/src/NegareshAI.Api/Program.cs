using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NegareshAI.Api.Data.NegareshDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("NegareshAI")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.MapGet("/health", () => Results.Ok(new { service = "negareshai-api", status = "healthy" }));
app.MapControllers();
app.Run();
