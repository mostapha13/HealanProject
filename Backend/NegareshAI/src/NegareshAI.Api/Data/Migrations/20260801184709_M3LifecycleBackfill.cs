using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class M3LifecycleBackfill : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "LifecycleStatus",
                table: "DocumentVersions",
                type: "int",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.Sql("""
                UPDATE [DocumentVersions]
                SET [LifecycleStatus] = CASE
                    WHEN NULLIF(LTRIM(RTRIM([ExtractedText])), '') IS NULL THEN 1
                    ELSE 2
                END
                WHERE [LifecycleStatus] = 0;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "LifecycleStatus",
                table: "DocumentVersions",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 1);
        }
    }
}
