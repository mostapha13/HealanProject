using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class PortalSiteSettingConfiguration : IEntityTypeConfiguration<PortalSiteSetting>
{
    public void Configure(EntityTypeBuilder<PortalSiteSetting> builder)
    {
        builder.ToTable("PortalSiteSettings");
        builder.HasKey(x => x.PortalSiteSettingId);
        builder.Property(x => x.PortalSiteSettingId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.SettingKey).IsRequired().HasMaxLength(100);
        builder.Property(x => x.SettingValue).IsRequired().HasMaxLength(4000);
        builder.Property(x => x.SettingGroup).HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.HasIndex(x => x.SettingKey).IsUnique();
    }
}
