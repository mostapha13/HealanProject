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
    public class WorkFlowItemConfiguration : IEntityTypeConfiguration<WorkFlowItem>
    {
        public void Configure(EntityTypeBuilder<WorkFlowItem> builder)
        {
            builder.ToTable("WorkFlowItem");
            builder.HasKey(a => a.WorkFlowItemId);
            builder.Property(a => a.WorkFlowItemId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).ValueGeneratedOnAdd();
            builder.Property(a => a.OrderId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();
            builder.Property(a => a.WorkFlowGuideId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();
            builder.Property(a => a.WorkFlowDate).HasColumnType(nameof(System.Data.SqlDbType.DateTime)).IsRequired();
            builder.Property(a => a.HasObserved).HasColumnType(nameof(System.Data.SqlDbType.Bit)).IsRequired();
            builder.Property(a => a.UserId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();

            builder.HasOne(a => a.Order).WithMany(b => b.WorkFlowItems).HasForeignKey(c => c.OrderId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.WorkFlowGuide).WithMany(b => b.WorkFlowItems).HasForeignKey(c => c.WorkFlowGuideId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
