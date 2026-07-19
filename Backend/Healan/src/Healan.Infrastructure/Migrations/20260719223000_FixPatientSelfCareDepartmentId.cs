using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260719223000_FixPatientSelfCareDepartmentId")]
    public partial class FixPatientSelfCareDepartmentId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // DepartmentId is short (smallint) in the domain; tables were created with int → InvalidCastException.
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.PatientMedicationReminders', N'DepartmentId') IS NOT NULL
    ALTER TABLE [PatientMedicationReminders] ALTER COLUMN [DepartmentId] smallint NOT NULL;
IF COL_LENGTH(N'dbo.PatientBloodPressureLogs', N'DepartmentId') IS NOT NULL
    ALTER TABLE [PatientBloodPressureLogs] ALTER COLUMN [DepartmentId] smallint NOT NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.PatientMedicationReminders', N'DepartmentId') IS NOT NULL
    ALTER TABLE [PatientMedicationReminders] ALTER COLUMN [DepartmentId] int NOT NULL;
IF COL_LENGTH(N'dbo.PatientBloodPressureLogs', N'DepartmentId') IS NOT NULL
    ALTER TABLE [PatientBloodPressureLogs] ALTER COLUMN [DepartmentId] int NOT NULL;
");
        }
    }
}
