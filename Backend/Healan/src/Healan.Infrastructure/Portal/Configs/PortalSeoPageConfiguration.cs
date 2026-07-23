using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class PortalSeoPageConfiguration : IEntityTypeConfiguration<PortalSeoPage>
{
    public void Configure(EntityTypeBuilder<PortalSeoPage> builder)
    {
        builder.ToTable("PortalSeoPages");
        builder.HasKey(x => x.PortalSeoPageId);
        builder.Property(x => x.PortalSeoPageId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.PageKey).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Path).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.Keywords).HasMaxLength(500);
        builder.Property(x => x.OgTitle).HasMaxLength(300);
        builder.Property(x => x.OgDescription).HasMaxLength(1000);
        builder.Property(x => x.OgImageUrl).HasMaxLength(1000);
        builder.Property(x => x.OgImageFileId).HasColumnType("uniqueidentifier");
        builder.Property(x => x.CanonicalUrl).HasMaxLength(1000);
        builder.Property(x => x.Robots).HasMaxLength(100).HasDefaultValue("index,follow");
        builder.Property(x => x.JsonLdExtra).HasColumnType("nvarchar(max)");
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.HasIndex(x => x.PageKey).IsUnique();
        builder.HasIndex(x => x.Path);
        builder.HasIndex(x => new { x.IsActive, x.SortOrder });
    }
}