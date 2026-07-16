using System;
using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260716113000_AddSmsSettings")]
    public partial class AddSmsSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Hand-written migration (no Designer model): avoid InsertData — EF needs entity
            // mappings / columnTypes for data operations and crashes otherwise.
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[SmsSettings]', N'U') IS NULL
BEGIN
    CREATE TABLE [SmsSettings] (
        [SmsSettingId] int NOT NULL,
        [ApiKey] nvarchar(200) NOT NULL,
        [TemplateId] int NOT NULL CONSTRAINT [DF_SmsSettings_TemplateId] DEFAULT 640023,
        [LineNumber] bigint NOT NULL CONSTRAINT [DF_SmsSettings_LineNumber] DEFAULT CAST(0 AS bigint),
        [VerifyParameterName] nvarchar(50) NOT NULL,
        [SendEnabled] bit NOT NULL CONSTRAINT [DF_SmsSettings_SendEnabled] DEFAULT CAST(1 AS bit),
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_SmsSettings] PRIMARY KEY ([SmsSettingId])
    );
END

IF NOT EXISTS (SELECT 1 FROM [SmsSettings] WHERE [SmsSettingId] = 1)
BEGIN
    INSERT INTO [SmsSettings] ([SmsSettingId], [ApiKey], [TemplateId], [LineNumber], [VerifyParameterName], [SendEnabled], [UpdatedAt])
    VALUES (1, N'', 640023, CAST(0 AS bigint), N'Code', CAST(1 AS bit), '2026-07-16T00:00:00');
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[SmsSettings]', N'U') IS NOT NULL
    DROP TABLE [SmsSettings];
");
        }
    }
}
