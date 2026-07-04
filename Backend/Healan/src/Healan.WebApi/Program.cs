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

                    //  await context.Database.EnsureCreatedAsync();

                    //if (context.Database.IsSqlServer())
                    //{
                    //    context.Database.Migrate();
                    //}

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
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureKestrel(a => a.AddServerHeader = false);
                });
    }
}
