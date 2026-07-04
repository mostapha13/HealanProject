using Healan.Domain.Common.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Infrastructure.Common.Configs;

public class OrderDetailConfiguration : IEntityTypeConfiguration<OrderDetail>
{
    public void Configure(EntityTypeBuilder<OrderDetail> builder)
    {
        builder.ToTable("OrderDetail");
        builder.HasKey(a => a.OrderId);
        builder.Property(a => a.OrderId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).ValueGeneratedNever();
        builder.Property(a => a.FundId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();
        //builder.Property(a => a.InstrumentId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
        builder.Property(a => a.InstrumentParameterId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
        builder.Property(a => a.BringCash).HasColumnType("decimal(18,0)").HasDefaultValue(0);
        builder.Property(a => a.BringShare).HasColumnType("decimal(18,0)").HasDefaultValue(0);
        builder.Property(a => a.StartDate).IsRequired().HasDefaultValueSql("getdate()");
        builder.Property(a => a.EndDate).IsRequired().HasDefaultValueSql("getdate()");

        builder.Property(a => a.IsDeny).HasColumnType(nameof(System.Data.SqlDbType.Bit)).HasDefaultValue(false).IsRequired();

  
    }
}