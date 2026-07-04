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
    public class WorkFlowGuideConfiguration : IEntityTypeConfiguration<WorkFlowGuide>
    {
        public void Configure(EntityTypeBuilder<WorkFlowGuide> builder)
        {
            builder.ToTable("WorkFlowGuide");
            builder.HasKey(a => a.WorkFlowGuideId);
            builder.Property(a => a.WorkFlowGuideId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).ValueGeneratedOnAdd();
            builder.Property(a => a.SenderGroupId).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();
            builder.Property(a => a.ReceiverGroupId).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();
            builder.Property(a => a.FormId).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();
            builder.Property(a => a.WorkFlowTypeId).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();
            builder.Property(a => a.ParentId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
            builder.Property(a => a.Weight).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();



            builder.HasOne(a => a.WorkFlowUserGroupSender).WithMany(b => b.WorkFlowGuideSenders).HasForeignKey(c => c.SenderGroupId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.WorkFlowUserGroupReceiver).WithMany(b => b.WorkFlowGuideReceivers).HasForeignKey(c => c.ReceiverGroupId).OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.Form).WithMany(b => b.WorkFlowGuides).HasForeignKey(c => c.FormId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.WorkFlowType).WithMany(b => b.WorkFlowGuides).HasForeignKey(c => c.WorkFlowTypeId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.Parent).WithMany(b => b.Childs).HasForeignKey(c => c.ParentId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
