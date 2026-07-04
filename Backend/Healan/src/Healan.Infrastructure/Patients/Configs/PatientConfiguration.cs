using Healan.Domain.Patients.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Patients.Configs;
public class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        builder.ToTable("Patients");

        builder.HasKey(p => p.PatientId);
        builder.Property(p => p.PatientId).HasColumnType("bigint").ValueGeneratedOnAdd();

        builder.Property(p => p.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(p => p.LastName).IsRequired().HasMaxLength(100);
        builder.Property(p => p.NationalCode).IsRequired().HasMaxLength(10);
        builder.HasIndex(p => p.NationalCode).IsUnique();
        builder.Property(p => p.PhoneNumber).IsRequired().HasMaxLength(50);




        builder.HasMany(p => p.Appointments)
               .WithOne(a => a.Patient)
               .HasForeignKey(a => a.PatientId)
               .OnDelete(DeleteBehavior.Restrict);


        builder.HasOne(p => p.User)
        .WithMany(r => r.Patients)
        .HasForeignKey(r => r.UserId)
        .OnDelete(DeleteBehavior.Restrict);
    }
}