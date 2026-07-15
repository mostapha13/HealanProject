using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using Share.Infrastructure.Logging;

namespace Healan.WebApi
{
    public class Program
    {
        public async static Task Main(string[] args)
        {
            TseLog.Addlog();
            var host = CreateHostBuilder(args).Build();

            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;

                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();

                    try
                    {
                        context.Database.Migrate();
                    }
                    catch (Exception ex)
                    {
                        throw;
                    }

                    await ApplicationDbContextSeed.SeedAsync(context);
                }
                catch (Exception ex)
                {
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while migrating or seeding the database.");
                    throw;
                }
            }

            await host.RunAsync();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                 .UseTselog()
                .ConfigureAppConfiguration((context, config) =>
                {
                    // Last layer wins: force Docker service names when baked-in localhost
                    // values leak because appsettings.Production.json was partially restored.
                    if (!context.HostingEnvironment.IsProduction()
                        && !string.Equals(
                            Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"),
                            "true",
                            StringComparison.OrdinalIgnoreCase))
                        return;

                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["IdentityServer:Url"] = "http://identity-server:8080/",
                        ["IdentityServer:ValidIssuer"] = "http://auth.drshahrooei.ir",
                        ["IdentityServer:RequireHttpsMetadata"] = "false",
                        ["GrpcServer:IdentityServer"] = "http://identity-grpc:8080",
                        ["GrpcServer:FileManager"] = "http://filemanager-grpc:8080",
                        ["WorkFlowBaseUrl"] = "http://workflow-webui:8080/",
                        ["SMSProviderBaseUrl"] = "http://smsprovider-webapp:8080/api/v1/SMS/",
                        ["Redis:Hosts:0:Host"] = "redis",
                        ["Redis:Hosts:0:Port"] = "6379",
                    });
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureKestrel(a => a.AddServerHeader = false);
                });
    }
}
