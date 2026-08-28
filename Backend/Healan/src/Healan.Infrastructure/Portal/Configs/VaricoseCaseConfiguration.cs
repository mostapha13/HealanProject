using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class VaricoseCaseConfiguration : IEntityTypeConfiguration<VaricoseCase>
{
    public void Configure(EntityTypeBuilder<VaricoseCase> builder)
    {
        builder.ToTable("VaricoseCases");
        builder.HasKey(x => x.VaricoseCaseId);
        builder.Property(x => x.VaricoseCaseId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.Title).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(1500);
        builder.Property(x => x.BeforeImageUrl).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.AfterImageUrl).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.TreatmentLabel).HasMaxLength(200);
        builder.HasIndex(x => new { x.IsPublished, x.SortOrder });
    }
}
