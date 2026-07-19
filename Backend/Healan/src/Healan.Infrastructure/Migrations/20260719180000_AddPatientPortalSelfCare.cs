using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260719180000_AddPatientPortalSelfCare")]
    public partial class AddPatientPortalSelfCare : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.PatientBloodPressureLogs', N'U') IS NULL
BEGIN
    CREATE TABLE [PatientBloodPressureLogs] (
        [PatientBloodPressureLogId] bigint NOT NULL IDENTITY(1,1),
        [PatientId] bigint NOT NULL,
        [Systolic] int NOT NULL,
        [Diastolic] int NOT NULL,
        [Pulse] int NULL,
        [MeasuredAt] datetime2 NOT NULL,
        [Note] nvarchar(500) NULL,
        [CreatedBy] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [DepartmentId] int NOT NULL,
        [LastModifiedBy] uniqueidentifier NULL,
        [LastModifiedAt] datetime2 NULL,
        [DeletedBy] uniqueidentifier NULL,
        [DeletedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_PatientBloodPressureLogs_IsDeleted] DEFAULT 0,
        CONSTRAINT [PK_PatientBloodPressureLogs] PRIMARY KEY ([PatientBloodPressureLogId]),
        CONSTRAINT [FK_PatientBloodPressureLogs_Patients_PatientId] FOREIGN KEY ([PatientId]) REFERENCES [Patients] ([PatientId]) ON DELETE NO ACTION
    );
    CREATE INDEX [IX_PatientBloodPressureLogs_PatientId_MeasuredAt] ON [PatientBloodPressureLogs] ([PatientId], [MeasuredAt]);
END

IF OBJECT_ID(N'dbo.PatientMedicationReminders', N'U') IS NULL
BEGIN
    CREATE TABLE [PatientMedicationReminders] (
        [PatientMedicationReminderId] bigint NOT NULL IDENTITY(1,1),
        [PatientId] bigint NOT NULL,
        [MedicationName] nvarchar(200) NOT NULL,
        [Dose] nvarchar(100) NULL,
        [TimesOfDay] nvarchar(200) NOT NULL,
        [IsActive] bit NOT NULL CONSTRAINT [DF_PatientMedicationReminders_IsActive] DEFAULT 1,
        [CreatedBy] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [DepartmentId] int NOT NULL,
        [LastModifiedBy] uniqueidentifier NULL,
        [LastModifiedAt] datetime2 NULL,
        [DeletedBy] uniqueidentifier NULL,
        [DeletedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_PatientMedicationReminders_IsDeleted] DEFAULT 0,
        CONSTRAINT [PK_PatientMedicationReminders] PRIMARY KEY ([PatientMedicationReminderId]),
        CONSTRAINT [FK_PatientMedicationReminders_Patients_PatientId] FOREIGN KEY ([PatientId]) REFERENCES [Patients] ([PatientId]) ON DELETE NO ACTION
    );
    CREATE INDEX [IX_PatientMedicationReminders_PatientId_IsActive] ON [PatientMedicationReminders] ([PatientId], [IsActive]);
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.PatientMedicationReminders', N'U') IS NOT NULL DROP TABLE [PatientMedicationReminders];
IF OBJECT_ID(N'dbo.PatientBloodPressureLogs', N'U') IS NOT NULL DROP TABLE [PatientBloodPressureLogs];
");
        }
    }
}
