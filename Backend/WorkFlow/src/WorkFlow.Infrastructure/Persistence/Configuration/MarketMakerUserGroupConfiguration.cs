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
    public class WorkFlowUserGroupConfiguration : IEntityTypeConfiguration<WorkFlowUserGroup>
    {
        public void Configure(EntityTypeBuilder<WorkFlowUserGroup> builder)
        {
            builder.ToTable("WorkFlowUserGroup");
            builder.HasKey(a => a.WorkFlowUserGroupId);
            builder.Property(a => a.WorkFlowUserGroupId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedNever();
            builder.Property(a => a.GroupName).HasMaxLength(100).HasColumnType("nvarchar(100)").IsRequired();
        }
    }
}
