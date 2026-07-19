using Healan.Domain.Patients.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Patients.Configs;

public class PatientBloodPressureLogConfiguration : IEntityTypeConfiguration<PatientBloodPressureLog>
{
    public void Configure(EntityTypeBuilder<PatientBloodPressureLog> builder)
    {
        builder.ToTable("PatientBloodPressureLogs");
        builder.HasKey(x => x.PatientBloodPressureLogId);
        builder.Property(x => x.PatientBloodPressureLogId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.Property(x => x.MeasuredTime).HasColumnType("time");
        builder.HasIndex(x => new { x.PatientId, x.MeasuredAt });
        builder.HasOne(x => x.Patient)
            .WithMany()
            .HasForeignKey(x => x.PatientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
