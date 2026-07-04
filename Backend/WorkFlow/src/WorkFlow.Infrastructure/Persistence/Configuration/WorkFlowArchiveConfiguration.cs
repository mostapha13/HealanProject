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
    public class WorkFlowArchiveConfiguration : IEntityTypeConfiguration<WorkFlowArchive>
    {
        public void Configure(EntityTypeBuilder<WorkFlowArchive> builder)
        {
            builder.ToTable("WorkFlowArchive");
            builder.HasKey(a => a.WorkFlowArchiveId);
            builder.Property(a => a.WorkFlowArchiveId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).ValueGeneratedOnAdd();
            builder.Property(a => a.WorkFlowItemId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();
            builder.Property(a => a.WorkFlowGuidId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();
            builder.Property(a => a.OrderId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();
            builder.Property(a => a.WorkFlowDate).HasColumnType(nameof(System.Data.SqlDbType.DateTime)).IsRequired();
            builder.Property(a => a.WorkFlowArchiveDate).HasColumnType(nameof(System.Data.SqlDbType.DateTime)).IsRequired();
            builder.Property(a => a.UserId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();

            builder.HasOne(a => a.Order).WithMany(b => b.WorkFlowArchives).HasForeignKey(c => c.OrderId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.WorkFlowGuide).WithMany(b => b.WorkFlowArchives).HasForeignKey(c => c.WorkFlowGuidId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
