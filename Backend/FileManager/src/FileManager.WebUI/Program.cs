using FileManager.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Share.Infrastructure.Logging;
using System;
using System.Threading.Tasks;

namespace FileManager.WebUI
{
    public class Program
    {
        public async static Task Main(string[] args)
        {
            TseLog.Addlog();
            Console.WriteLine("[FileManager] Building host…");
            var host = CreateHostBuilder(args).Build();

            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    Console.WriteLine("[FileManager] Migrating database…");
                    var context = services.GetRequiredService<ApplicationDbContext>();
                    context.Database.Migrate();
                    Console.WriteLine("[FileManager] Migrate OK");
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"[FileManager] Migrate FAILED: {ex.GetType().Name}: {ex.Message}");
                    if (ex.InnerException != null)
                        Console.Error.WriteLine($"[FileManager] Migrate INNER: {ex.InnerException.Message}");
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while migrating or seeding the database.");
                }
            }

            Console.WriteLine("[FileManager] Starting Kestrel (ASPNETCORE_URLS)…");
            await host.RunAsync();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .UseTselog()
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureKestrel(a => a.AddServerHeader = false);
                });
    }
}
