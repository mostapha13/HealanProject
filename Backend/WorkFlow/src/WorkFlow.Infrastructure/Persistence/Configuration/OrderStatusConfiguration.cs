using WorkFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Infrastructure.Persistence.Configuration
{
    public class OrderStatusConfiguration : IEntityTypeConfiguration<OrderStatus>
    {
        public void Configure(EntityTypeBuilder<OrderStatus> builder)
        {
            builder.ToTable("OrderStatus");
            builder.HasKey(a => a.OrderStatusId);
            builder.Property(a => a.OrderStatusId).HasColumnType(nameof(System.Data.SqlDbType.TinyInt));
            builder.Property(a => a.Name).HasMaxLength(50).HasColumnType("nvarchar(50)").IsRequired();
        }
    }
}
