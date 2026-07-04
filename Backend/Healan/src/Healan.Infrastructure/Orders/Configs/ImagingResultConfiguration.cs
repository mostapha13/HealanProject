using Healan.Domain.Orders.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Orders.Configs;

public class ImagingResultConfiguration : IEntityTypeConfiguration<ImagingResult>
{
    public void Configure(EntityTypeBuilder<ImagingResult> builder)
    {
        builder.ToTable("ImagingResults");
        builder.HasKey(r => r.ImagingResultId);

        builder.Property(r => r.Report).HasMaxLength(1000);
    }
}