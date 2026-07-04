using Healan.Domain.Doctors.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Doctors.Configs;
public class DoctorConfiguration : IEntityTypeConfiguration<Doctor>
{
    public void Configure(EntityTypeBuilder<Doctor> builder)
    {
        builder.ToTable("Doctors");

        builder.HasKey(d => d.DoctorId);
        builder.Property(p => p.DoctorId).HasColumnType("bigint").ValueGeneratedOnAdd();

        builder.Property(d => d.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(d => d.LastName).IsRequired().HasMaxLength(100);
        builder.Property(d => d.NationalCode).IsRequired().HasMaxLength(10);
        builder.HasIndex(d => d.NationalCode).IsUnique();
        builder.Property(d => d.Mobile).IsRequired().HasMaxLength(15);
        builder.Property(d => d.PersonnelNumber).HasMaxLength(50);
        builder.Property(d => d.UserId).IsRequired();

        builder.HasOne(d => d.Company)
               .WithMany(c => c.Doctors)
               .HasForeignKey(d => d.CompanyId)
               .OnDelete(DeleteBehavior.Restrict);

    
        builder.HasMany(d => d.Appointments)
               .WithOne(a => a.Doctor)
               .HasForeignKey(a => a.DoctorId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.User)
        .WithMany(a => a.Doctors)
        .HasForeignKey(a => a.UserId)
        .OnDelete(DeleteBehavior.Restrict);


    }
}