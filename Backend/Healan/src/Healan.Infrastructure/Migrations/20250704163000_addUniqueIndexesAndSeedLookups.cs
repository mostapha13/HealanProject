using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    /// <summary>
    /// ایندکس یکتای کد ملی و داده‌های پایه lookup برای نصب اولیه.
    /// </summary>
    public partial class addUniqueIndexesAndSeedLookups : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Patients_NationalCode' AND object_id = OBJECT_ID(N'Patients'))
                    CREATE UNIQUE INDEX IX_Patients_NationalCode ON Patients (NationalCode);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Doctors_NationalCode' AND object_id = OBJECT_ID(N'Doctors'))
                    CREATE UNIQUE INDEX IX_Doctors_NationalCode ON Doctors (NationalCode);
                """);

            SeedLookupTable(migrationBuilder, "CompanyRegistrationTypes", "CompanyRegistrationTypeId", "CompanyRegistrationTypeName", new (int, string)[]
            {
                (1, "بیمارستان"),
                (2, "کلینیک"),
                (3, "مطب"),
            });

            SeedLookupTable(migrationBuilder, "InsuranceTypes", "InsuranceTypeId", "InsuranceTypeName", new (int, string)[]
            {
                (1, "آزاد"),
                (2, "بیمه اصلی"),
                (3, "بیمه تکمیلی"),
            });

            SeedLookupTable(migrationBuilder, "CategoryTypes", "CategoryTypeId", "CategoryTypeName", new (int, string)[]
            {
                (1, "ویزیت پزشک عمومی"),
                (2, "ویزیت پزشک متخصص"),
                (3, "آزمایشگاه"),
                (4, "تصویربرداری"),
                (5, "اقدامات درمانی یا جراحی کوچک"),
                (6, "خدمات پرستاری تزریقات، پانسمان، تزریق وریدی"),
                (7, "فیزوتراپی، کار‌دمانی"),
                (8, "مشاوره تخصصی حضوری یا غیرحضوری"),
            });

            SeedLookupTable(migrationBuilder, "UserTypes", "UserTypeId", "UserTypeName", new (int, string)[]
            {
                (1, "رئیس"),
                (2, "مدیر"),
                (3, "منشی"),
                (4, "پرستار"),
                (5, "کمک پرستار"),
                (6, "کاربر عمومی"),
                (7, "پزشک"),
                (8, "حسابدار"),
                (9, "بیمار"),
            });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Patients_NationalCode' AND object_id = OBJECT_ID(N'Patients'))
                    DROP INDEX IX_Patients_NationalCode ON Patients;

                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Doctors_NationalCode' AND object_id = OBJECT_ID(N'Doctors'))
                    DROP INDEX IX_Doctors_NationalCode ON Doctors;
                """);
        }

        private static void SeedLookupTable(
            MigrationBuilder migrationBuilder,
            string table,
            string idColumn,
            string nameColumn,
            (int Id, string Name)[] rows)
        {
            foreach (var row in rows)
            {
                var safeName = row.Name.Replace("'", "''");
                migrationBuilder.Sql($"""
                    IF NOT EXISTS (SELECT 1 FROM {table} WHERE {idColumn} = {row.Id})
                        INSERT INTO {table} ({idColumn}, {nameColumn}) VALUES ({row.Id}, N'{safeName}');
                    """);
            }
        }
    }
}
