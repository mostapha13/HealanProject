using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class PortalContactMessageConfiguration : IEntityTypeConfiguration<PortalContactMessage>
{
    public void Configure(EntityTypeBuilder<PortalContactMessage> builder)
    {
        builder.ToTable("PortalContactMessages");
        builder.HasKey(x => x.PortalContactMessageId);
        builder.Property(x => x.PortalContactMessageId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.LastName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Mobile).IsRequired().HasMaxLength(20);
        builder.Property(x => x.Message).IsRequired().HasMaxLength(3000);
        builder.Property(x => x.AdminNote).HasMaxLength(1500);
        builder.HasIndex(x => new { x.IsRead, x.CreatedAt });
        builder.HasIndex(x => new { x.Mobile, x.CreatedAt });
    }
}
