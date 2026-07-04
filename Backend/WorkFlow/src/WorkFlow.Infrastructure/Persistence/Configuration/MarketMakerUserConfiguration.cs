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
    public class WorkFlowUserConfiguration : IEntityTypeConfiguration<WorkFlowUser>
    {
        public void Configure(EntityTypeBuilder<WorkFlowUser> builder)
        {
            builder.ToTable("WorkFlowUser");
            builder.HasKey(a => a.WorkFlowUserId);
            builder.Property(a => a.WorkFlowUserId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).ValueGeneratedOnAdd();
            builder.Property(a => a.FirstName).HasMaxLength(50).HasColumnType("nvarchar(50)").IsRequired();
            builder.Property(a => a.LastName).HasMaxLength(100).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.PhoneNumber).HasMaxLength(20).HasColumnType("nvarchar(20)").IsRequired();
            builder.Property(a => a.FundId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
            builder.Property(a => a.BrokerId).HasDefaultValue(null);
            builder.Property(a => a.IsActive).HasColumnType(nameof(System.Data.SqlDbType.Bit)).IsRequired();
            builder.Property(a => a.IsConfirmed).HasColumnType(nameof(System.Data.SqlDbType.Bit)).IsRequired().HasDefaultValue(true);
            builder.Property(a => a.WorkFlowUserGroupId).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();
            builder.HasOne(a => a.WorkFlowUserGroup).WithMany(b => b.WorkFlowUsers).HasForeignKey(c => c.WorkFlowUserGroupId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.Fund).WithMany(b => b.WorkFlowUsers).HasForeignKey(c => c.FundId).OnDelete(DeleteBehavior.Restrict);
        }

    }
}
