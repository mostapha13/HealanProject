using Microsoft.EntityFrameworkCore;
using SMSProvider.Infrastructure.Persistence;

namespace SMSProvider.WebApp;

public class Program
{
    public static async Task Main(string[] args)
    {
        var host = CreateHostBuilder(args).Build();

        using (var scope = host.Services.CreateScope())
        {
            try
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await db.Database.EnsureCreatedAsync();
                // EnsureCreated جدول‌های جدید را روی دیتابیس موجود نمی‌سازد
                await db.Database.ExecuteSqlRawAsync("""
                    IF OBJECT_ID(N'dbo.SmsProviderSettings', N'U') IS NULL
                    BEGIN
                        CREATE TABLE dbo.SmsProviderSettings (
                            Id int NOT NULL PRIMARY KEY,
                            ApiKey nvarchar(200) NOT NULL,
                            TemplateId int NOT NULL CONSTRAINT DF_SmsProviderSettings_TemplateId DEFAULT (640023),
                            LineNumber bigint NOT NULL CONSTRAINT DF_SmsProviderSettings_LineNumber DEFAULT (0),
                            VerifyParameterName nvarchar(50) NOT NULL,
                            SendEnabled bit NOT NULL CONSTRAINT DF_SmsProviderSettings_SendEnabled DEFAULT (1),
                            UpdatedAt datetime2 NOT NULL
                        );
                    END
                    """);
            }
            catch (Exception ex)
            {
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "SMSProvider database init failed");
            }
        }

        await host.RunAsync();
    }

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
                webBuilder.ConfigureKestrel(a => a.AddServerHeader = false);
            });
}
