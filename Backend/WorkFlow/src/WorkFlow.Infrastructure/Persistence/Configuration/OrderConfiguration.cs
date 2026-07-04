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
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.ToTable("ORDERS");
            builder.HasKey(a => a.OrderId);
            builder.Property(a => a.OrderId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).ValueGeneratedOnAdd();
            builder.Property(a => a.OrderParentId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
            builder.Property(a => a.OrderStatusId).HasColumnType(nameof(System.Data.SqlDbType.TinyInt)).IsRequired();
            builder.Property(a => a.TrackingNumber).HasColumnType("varchar(50)").IsRequired().HasDefaultValue("1000000");
            builder.Property(a => a.IsDeleted).HasColumnType(nameof(System.Data.SqlDbType.Bit)).IsRequired().HasDefaultValue(false);
            builder.Property(a => a.WorkFlowUserId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
            builder.Property(a => a.CreateDate).HasColumnType(nameof(System.Data.SqlDbType.DateTime));
            builder.Property(a => a.ExtraInfo).HasColumnType("nvarchar(max)");
            builder.Property(a => a.Description).HasMaxLength(500).HasColumnType("nvarchar(500)");


            builder.HasOne(a => a.OrderStatus).WithMany(b => b.Orders).HasForeignKey(c => c.OrderStatusId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.ParentOrder).WithMany(b => b.OrderChilds).HasForeignKey(c => c.OrderParentId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.WorkFlowUser).WithMany(b => b.Orders).HasForeignKey(c => c.WorkFlowUserId).OnDelete(DeleteBehavior.Restrict);

        }
    }
}
