using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
namespace TSEAI.Infrastructure.Persistence;
public sealed class ReleaseMigrationRunner
{
    public async Task ApplyAsync(IServiceProvider services, CancellationToken ct=default)
    {
        var db=services.GetRequiredService<ApplicationDbContext>();
        await db.Database.OpenConnectionAsync(ct);
        try
        {
            await db.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.__TSEAISchemaMigrations','U') IS NULL CREATE TABLE dbo.__TSEAISchemaMigrations(MigrationId nvarchar(100) NOT NULL PRIMARY KEY,AppliedAtUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME());",ct);
            await db.Database.ExecuteSqlRawAsync("EXEC sp_getapplock @Resource='TSEAI_SCHEMA_MIGRATION',@LockMode='Exclusive',@LockOwner='Session',@LockTimeout=60000;",ct);
            await Apply(db,"001_platform_model",async()=>
            {
                var exists=await db.Database.SqlQueryRaw<int>("SELECT CAST(CASE WHEN OBJECT_ID('dbo.SystemSettings','U') IS NULL THEN 0 ELSE 1 END AS int) AS Value").SingleAsync(ct)==1;
                if(!exists) await db.GetService<IRelationalDatabaseCreator>().CreateTablesAsync(ct);
            },ct);
            await Apply(db,"007_saved_filters",async()=>await SavedFilterSchemaInitializer.EnsureAsync(db,ct),ct);
            await Apply(db,"008_alerts",async()=>await AlertSchemaInitializer.EnsureAsync(db,ct),ct);
            await Apply(db,"011_operations",async()=>await services.GetRequiredService<OperationsSchemaInitializer>().InitializeAsync(ct),ct);
        }
        finally
        {
            try { await db.Database.ExecuteSqlRawAsync("EXEC sp_releaseapplock @Resource='TSEAI_SCHEMA_MIGRATION',@LockOwner='Session';",ct); } catch { }
            await db.Database.CloseConnectionAsync();
        }
    }
    static async Task Apply(ApplicationDbContext db,string id,Func<Task> action,CancellationToken ct)
    {
        var done=await db.Database.SqlQuery<int>($"SELECT CAST(CASE WHEN EXISTS(SELECT 1 FROM dbo.__TSEAISchemaMigrations WHERE MigrationId={id}) THEN 1 ELSE 0 END AS int) AS Value").SingleAsync(ct)==1;
        if(done)return;
        await action();
        await db.Database.ExecuteSqlAsync($"INSERT dbo.__TSEAISchemaMigrations(MigrationId) VALUES({id})",ct);
    }
}
