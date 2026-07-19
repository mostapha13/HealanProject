using Healan.Domain.Patients.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Patients.Configs;

public class PatientMedicationReminderConfiguration : IEntityTypeConfiguration<PatientMedicationReminder>
{
    public void Configure(EntityTypeBuilder<PatientMedicationReminder> builder)
    {
        builder.ToTable("PatientMedicationReminders");
        builder.HasKey(x => x.PatientMedicationReminderId);
        builder.Property(x => x.PatientMedicationReminderId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.MedicationName).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Dose).HasMaxLength(100);
        builder.Property(x => x.TimesOfDay).IsRequired().HasMaxLength(200);
        builder.HasIndex(x => new { x.PatientId, x.IsActive });
        builder.HasOne(x => x.Patient)
            .WithMany()
            .HasForeignKey(x => x.PatientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
