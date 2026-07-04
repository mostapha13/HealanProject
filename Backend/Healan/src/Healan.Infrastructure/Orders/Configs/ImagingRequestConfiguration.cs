using Healan.Domain.Orders.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Orders.Configs;

public class ImagingRequestConfiguration : IEntityTypeConfiguration<ImagingRequest>
{
    public void Configure(EntityTypeBuilder<ImagingRequest> builder)
    {
        builder.ToTable("ImagingRequests");
        builder.HasKey(i => i.ImagingRequestId);

        builder.Property(i => i.ImageTypeId).IsRequired().HasMaxLength(200);
        builder.Property(i => i.Notes).HasMaxLength(500);

        builder.HasMany(i => i.ImagingResults)
               .WithOne(r => r.ImagingRequest)
               .HasForeignKey(r => r.ImagingRequestId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(l => l.Prescription)
      .WithMany(r => r.ImagingRequests)
      .HasForeignKey(r => r.PrescriptionId)
      .OnDelete(DeleteBehavior.Restrict);
    }
}
