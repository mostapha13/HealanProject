using Healan.Domain.Common.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace Healan.Infrastructure.Common.Configs;

public class OrderTypeConfiguration : IEntityTypeConfiguration<OrderType>
{
    public void Configure(EntityTypeBuilder<OrderType> builder)
    {
        builder.ToTable("OrderType");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(100).HasColumnType("Nvarchar(100)");
        builder.Property(x => x.StartForm).HasMaxLength(100).HasColumnType("Nvarchar(100)").HasDefaultValue(null);
        builder.Property(x => x.SearchForm).HasMaxLength(100).HasColumnType("Nvarchar(100)").HasDefaultValue(null);

        builder.HasMany(t => t.OrderCashInfos).WithOne(t => t.OrderType).HasForeignKey(t => t.OrderTypeId);


    }
}