using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace NegareshAI.Api.Data.Migrations;

[DbContext(typeof(NegareshDbContext))]
[Migration("20260729090000_PersianEmbeddingRuntimeDefault")]
public partial class PersianEmbeddingRuntimeDefault : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF NOT EXISTS (
                SELECT 1 FROM [RuntimeSettings]
                WHERE [OrganizationId] = '11111111-1111-1111-1111-111111111111'
                  AND [Category] = N'ai'
                  AND [Key] = N'embedding.model')
            BEGIN
                INSERT INTO [RuntimeSettings]
                    ([Id], [OrganizationId], [Category], [Key], [ValueJson],
                     [Version], [IsActive], [UpdatedByUserId], [UpdatedAtUtc])
                VALUES
                    ('29000000-0000-0000-0000-000000000001',
                     '11111111-1111-1111-1111-111111111111',
                     N'ai', N'embedding.model',
                     N'{"modelId":"BAAI/bge-m3","retrievalMode":"hybrid","normalizePersianDigits":true,"numericExactBoost":0.5}',
                     1, 1, N'system-migration', SYSUTCDATETIME())
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DELETE FROM [RuntimeSettings]
            WHERE [Id] = '29000000-0000-0000-0000-000000000001'
            """);
    }
}
