using Healan.Domain.Orders.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Orders.Configs;

public class PrescriptionConfiguration : IEntityTypeConfiguration<Prescription>
{
    public void Configure(EntityTypeBuilder<Prescription> builder)
    {
        builder.ToTable("Prescriptions");

        builder.HasKey(p => p.PrescriptionId);

        builder.Property(p => p.IssueDate).IsRequired();
        builder.Property(p => p.Notes).HasMaxLength(1000);

        builder.HasMany(p => p.PrescriptionDrugs)
               .WithOne(pi => pi.Prescription)
               .HasForeignKey(pi => pi.PrescriptionId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.LabTestRequests)
         .WithOne(pi => pi.Prescription)
         .HasForeignKey(pi => pi.PrescriptionId)
         .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.ImagingRequests)
         .WithOne(pi => pi.Prescription)
         .HasForeignKey(pi => pi.PrescriptionId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}
