using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TSEAI.Identity.Domain;
using TSEAI.Identity.Domain.Entities;
using TSEAI.Identity.Infrastructure.Persistence;
using TSEAIIdentityConstants = TSEAI.Identity.Domain.IdentityConstants;
namespace TSEAI.Identity.Infrastructure;
public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken ct = default)
    {
        var db = services.GetRequiredService<IdentityDbContext>();
        var env = services.GetRequiredService<IHostEnvironment>();
        if (env.IsProduction())
        {
            await db.Database.OpenConnectionAsync(ct);
            try
            {
                await db.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.__TSEAIIdentitySchemaMigrations','U') IS NULL CREATE TABLE dbo.__TSEAIIdentitySchemaMigrations(MigrationId nvarchar(100) NOT NULL PRIMARY KEY,AppliedAtUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME());",ct);
                await db.Database.ExecuteSqlRawAsync("EXEC sp_getapplock @Resource='TSEAI_IDENTITY_SCHEMA_MIGRATION',@LockMode='Exclusive',@LockOwner='Session',@LockTimeout=60000;",ct);
                var tableExists = await db.Database.SqlQueryRaw<int>("SELECT CAST(CASE WHEN OBJECT_ID('dbo.AspNetUsers','U') IS NULL THEN 0 ELSE 1 END AS int) AS Value").SingleAsync(ct)==1;
                var recorded = await db.Database.SqlQueryRaw<int>("SELECT CAST(CASE WHEN EXISTS(SELECT 1 FROM dbo.__TSEAIIdentitySchemaMigrations WHERE MigrationId='001_identity_model') THEN 1 ELSE 0 END AS int) AS Value").SingleAsync(ct)==1;
                if(!recorded) { if(!tableExists) await db.GetService<IRelationalDatabaseCreator>().CreateTablesAsync(ct); await db.Database.ExecuteSqlRawAsync("INSERT dbo.__TSEAIIdentitySchemaMigrations(MigrationId) VALUES('001_identity_model')",ct); }
                var familyMigrationRecorded = await db.Database.SqlQueryRaw<int>("SELECT CAST(CASE WHEN EXISTS(SELECT 1 FROM dbo.__TSEAIIdentitySchemaMigrations WHERE MigrationId='002_refresh_token_family') THEN 1 ELSE 0 END AS int) AS Value").SingleAsync(ct)==1;
                if (!familyMigrationRecorded)
                {
                    await db.Database.ExecuteSqlRawAsync("IF COL_LENGTH('dbo.RefreshTokens','FamilyId') IS NULL BEGIN ALTER TABLE dbo.RefreshTokens ADD FamilyId uniqueidentifier NULL; UPDATE dbo.RefreshTokens SET FamilyId=Id WHERE FamilyId IS NULL; ALTER TABLE dbo.RefreshTokens ALTER COLUMN FamilyId uniqueidentifier NOT NULL; END; IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.RefreshTokens') AND name='IX_RefreshTokens_FamilyId_RevokedAtUtc') CREATE INDEX IX_RefreshTokens_FamilyId_RevokedAtUtc ON dbo.RefreshTokens(FamilyId,RevokedAtUtc); INSERT dbo.__TSEAIIdentitySchemaMigrations(MigrationId) VALUES('002_refresh_token_family');",ct);
                }
            }
            finally { try { await db.Database.ExecuteSqlRawAsync("EXEC sp_releaseapplock @Resource='TSEAI_IDENTITY_SCHEMA_MIGRATION',@LockOwner='Session';",ct); } catch { } await db.Database.CloseConnectionAsync(); }
        }
        else await db.Database.EnsureCreatedAsync(ct);
        var rm = services.GetRequiredService<RoleManager<ApplicationRole>>();
        foreach (var name in new[] { TSEAIIdentityConstants.Roles.User, TSEAIIdentityConstants.Roles.Admin, TSEAIIdentityConstants.Roles.SuperAdmin })
            if (!await rm.RoleExistsAsync(name)) await rm.CreateAsync(new ApplicationRole(name));
        foreach (var code in TSEAIIdentityConstants.Permissions.All)
            if (!await db.Permissions.AnyAsync(x => x.Code == code, ct)) db.Permissions.Add(new Permission { Code = code, Title = code });
        await db.SaveChangesAsync(ct);
        var permissions = await db.Permissions.ToListAsync(ct);
        foreach (var roleName in new[] { TSEAIIdentityConstants.Roles.Admin, TSEAIIdentityConstants.Roles.SuperAdmin })
        {
            var role = await rm.FindByNameAsync(roleName); if (role is null) continue;
            foreach (var p in permissions)
                if (!await db.RolePermissions.AnyAsync(x => x.RoleId == role.Id && x.PermissionId == p.Id, ct)) db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = p.Id });
        }
        var userRole = await rm.FindByNameAsync(TSEAIIdentityConstants.Roles.User);
        if (userRole is not null)
        {
            string[] userCodes = [TSEAIIdentityConstants.Permissions.ChatAsk, TSEAIIdentityConstants.Permissions.FilterCreate, TSEAIIdentityConstants.Permissions.FilterSave, TSEAIIdentityConstants.Permissions.FilterExport, TSEAIIdentityConstants.Permissions.AlertCreate];
            foreach (var p in permissions.Where(x => userCodes.Contains(x.Code)))
                if (!await db.RolePermissions.AnyAsync(x => x.RoleId == userRole.Id && x.PermissionId == p.Id, ct)) db.RolePermissions.Add(new RolePermission { RoleId = userRole.Id, PermissionId = p.Id });
        }
        await db.SaveChangesAsync(ct);
    }
}
