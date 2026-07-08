using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class PortalContentItemConfiguration : IEntityTypeConfiguration<PortalContentItem>
{
    public void Configure(EntityTypeBuilder<PortalContentItem> builder)
    {
        builder.ToTable("PortalContentItems");
        builder.HasKey(x => x.PortalContentItemId);
        builder.Property(x => x.PortalContentItemId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.SectionType).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(300);
        builder.Property(x => x.Subtitle).HasMaxLength(500);
        builder.Property(x => x.Body).HasMaxLength(4000);
        builder.Property(x => x.ImageUrl).HasMaxLength(1000);
        builder.Property(x => x.ImageFileId).HasColumnType("uniqueidentifier");
        builder.Property(x => x.IconName).HasMaxLength(100);
        builder.Property(x => x.LinkUrl).HasMaxLength(1000);
        builder.Property(x => x.Color).HasMaxLength(30);
        builder.Property(x => x.SortOrder).HasDefaultValue(0);
        builder.Property(x => x.IsPublished).HasDefaultValue(true);
        builder.HasIndex(x => new { x.SectionType, x.SortOrder });
    }
}
