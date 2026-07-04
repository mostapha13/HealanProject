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
    public class OrderCommentConfiguration : IEntityTypeConfiguration<OrderComment>
    {
        public void Configure(EntityTypeBuilder<OrderComment> builder)
        {
            builder.ToTable("OrderComment");
            builder.HasKey(a => a.OrderCommentId);
            builder.Property(a => a.OrderCommentId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).ValueGeneratedOnAdd();
            builder.Property(a => a.OrderId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();
            builder.Property(a => a.WorkFlowGuidId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();
            builder.Property(a => a.WorkFlowUserId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired();
            builder.Property(a => a.Comment).HasColumnType("nvarchar(max)").IsRequired();
            builder.Property(a => a.IsPrivate).HasColumnType(nameof(System.Data.SqlDbType.Bit)).IsRequired();
            builder.Property(a => a.CommentDate).HasColumnType(nameof(System.Data.SqlDbType.DateTime)).IsRequired();

            builder.HasOne(a => a.Order).WithMany(b => b.OrderComments).HasForeignKey(c => c.OrderId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(a => a.WorkFlowGuide).WithMany(b => b.OrderComments).HasForeignKey(c => c.WorkFlowGuidId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(a => a.WorkFlowUser).WithMany(b => b.OrderComments).HasForeignKey(c => c.WorkFlowUserId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
