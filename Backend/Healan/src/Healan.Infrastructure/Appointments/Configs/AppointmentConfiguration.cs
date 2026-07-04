using Healan.Domain.Appointments.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Appointments.Configs;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("Appointments");

        builder.HasKey(a => a.AppointmentId);

        builder.Property(a => a.AppointmentDate)
               .HasDefaultValueSql("GetDate()")
               .IsRequired();

        builder.Property(a => a.DurationMinutes).HasDefaultValue(null);
        builder.Property(a => a.ConfirmPrimaryInsuranceCompany).HasDefaultValue(false);
        builder.Property(a => a.ConfirmSecondInsuranceCompany).HasDefaultValue(false);
        builder.Property(a => a.DurationMinutes).HasDefaultValue(null);
        builder.Property(a => a.Note).HasDefaultValue(null);

        builder.HasMany(a => a.ServiceTypes).WithMany(p => p.Appointments);

        builder.HasOne(a => a.Patient)
               .WithMany(p => p.Appointments)
               .HasForeignKey(a => a.PatientId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Doctor)
               .WithMany(d => d.Appointments)
               .HasForeignKey(a => a.DoctorId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(a => a.Invoices)
               .WithOne(i => i.Appointment)
               .HasForeignKey(i => i.AppointmentId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.PrimaryInsuranceCompany)
               .WithMany(i => i.PrimaryInsuranceAppointments)
               .HasForeignKey(i => i.PrimaryInsuranceCompanyId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.SecondInsuranceCompany)
               .WithMany(i => i.SecondInsuranceAppointments)
               .HasForeignKey(i => i.SecondInsuranceCompanyId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}