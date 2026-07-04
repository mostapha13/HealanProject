using Healan.Domain.Common.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Infrastructure.Common.Configs;

public class OrderCashInfoConfiguration : IEntityTypeConfiguration<OrderCashInfo>
{
    public void Configure(EntityTypeBuilder<OrderCashInfo> builder)
    {
        builder.ToTable("OrderCashInfo");
        builder.HasKey(x => x.Id);
        builder.Property(t => t.OrderId).HasColumnName("OrderId").HasDefaultValue(null);
      
       
        builder.HasOne(t => t.OrderType).WithMany(t => t.OrderCashInfos).HasForeignKey(t => t.OrderTypeId);

    }
}
