using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260719210000_PatientPortalSelfCareEnhancements")]
    public partial class PatientPortalSelfCareEnhancements : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.PatientBloodPressureLogs', N'PeriodOfDay') IS NULL
    ALTER TABLE [PatientBloodPressureLogs] ADD [PeriodOfDay] tinyint NULL;
IF COL_LENGTH(N'dbo.PatientBloodPressureLogs', N'MeasuredTime') IS NULL
    ALTER TABLE [PatientBloodPressureLogs] ADD [MeasuredTime] time NULL;

IF COL_LENGTH(N'dbo.PatientMedicationReminders', N'IntervalHours') IS NULL
    ALTER TABLE [PatientMedicationReminders] ADD [IntervalHours] int NOT NULL CONSTRAINT [DF_PatientMedicationReminders_IntervalHours] DEFAULT 8;
IF COL_LENGTH(N'dbo.PatientMedicationReminders', N'FirstDoseTime') IS NULL
    ALTER TABLE [PatientMedicationReminders] ADD [FirstDoseTime] time NOT NULL CONSTRAINT [DF_PatientMedicationReminders_FirstDoseTime] DEFAULT '08:00:00';
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.PatientBloodPressureLogs', N'PeriodOfDay') IS NOT NULL
    ALTER TABLE [PatientBloodPressureLogs] DROP COLUMN [PeriodOfDay];
IF COL_LENGTH(N'dbo.PatientBloodPressureLogs', N'MeasuredTime') IS NOT NULL
    ALTER TABLE [PatientBloodPressureLogs] DROP COLUMN [MeasuredTime];
IF COL_LENGTH(N'dbo.PatientMedicationReminders', N'IntervalHours') IS NOT NULL
BEGIN
    ALTER TABLE [PatientMedicationReminders] DROP CONSTRAINT [DF_PatientMedicationReminders_IntervalHours];
    ALTER TABLE [PatientMedicationReminders] DROP COLUMN [IntervalHours];
END
IF COL_LENGTH(N'dbo.PatientMedicationReminders', N'FirstDoseTime') IS NOT NULL
BEGIN
    ALTER TABLE [PatientMedicationReminders] DROP CONSTRAINT [DF_PatientMedicationReminders_FirstDoseTime];
    ALTER TABLE [PatientMedicationReminders] DROP COLUMN [FirstDoseTime];
END
");
        }
    }
}
