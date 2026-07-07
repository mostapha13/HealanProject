using IdentityServer.Domain;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;
using Serilog;
using Share.Infrastructure.Logging;
using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using System.Linq;
using System.Net;

namespace IdentityServer
{
    public class Program
    {
        public static async Task Main(string[] args)
        {

            TseLog.Addlog();
            var host = CreateHostBuilder(args).Build();


            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();
                    if (context.Database.IsSqlServer())
                    {
                        //await context.Database.EnsureCreatedAsync();
                        await context.Database.MigrateAsync();
                    }




                    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
                    var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
                    await context.SeedAdmin(userManager, roleManager);

                    try
                    {
                        await HealanAccessSeed.SeedAsync(context, roleManager);
                    }
                    catch (Exception accessEx)
                    {
                        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                        logger.LogError(accessEx, "Healan access seed failed — clinic users were still seeded.");
                    }
                }
                catch (Exception ex)
                {
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while migrating or seeding the database.");
                    throw;
                }
            }
            host.Run();

        }

        public static IWebHost BuildWebHost(string[] args, IConfiguration configuration) =>
            WebHost.CreateDefaultBuilder(args)
                // .UseUrls(configuration["IdentityServer:BaseUrl"])
                .UseStartup<Startup>()
                .Build();

        //public static IHostBuilder CreateHostBuilder(string[] args) =>
        //   Host.CreateDefaultBuilder(args)
        //    .UseTselog()
        //       .ConfigureWebHostDefaults(webBuilder =>
        //       {
        //           webBuilder.UseStartup<Startup>();
        //           webBuilder.UseKestrel(
        //        option => option.Listen(IPAddress.Any, 443,
        //                listenOptions =>
        //                {
        //                    listenOptions.UseHttps("TSE1404.pfx",
        //                        "T$3#1404");
        //                }));
        //           webBuilder.ConfigureKestrel(a => a.AddServerHeader = false);
        //       });
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
