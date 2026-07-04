using Healan.Domain.Orders.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Orders.Configs;

public class LabTestRequestConfiguration : IEntityTypeConfiguration<LabTestRequest>
{
    public void Configure(EntityTypeBuilder<LabTestRequest> builder)
    {
        builder.ToTable("LabTestRequests");
        builder.HasKey(l => l.LabTestRequestId);

        builder.Property(l => l.LabTestType).IsRequired().HasMaxLength(200);
        builder.Property(l => l.Notes).HasMaxLength(500);

        builder.HasMany(l => l.LabTestResults)
               .WithOne(r => r.LabTestRequest)
               .HasForeignKey(r => r.LabTestRequestId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(l => l.Prescription)
            .WithMany(r => r.LabTestRequests)
            .HasForeignKey(r => r.PrescriptionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}