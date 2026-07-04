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
    public class WorkFlowTypeConfiguration : IEntityTypeConfiguration<WorkFlowType>
    {
        public void Configure(EntityTypeBuilder<WorkFlowType> builder)
        {
            builder.ToTable("WorkFlowType");
            builder.HasKey(a => a.WorkFlowTypeId);
            builder.Property(a => a.WorkFlowTypeId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedNever();
            builder.Property(a => a.WorkFlowName).HasMaxLength(100).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.RecordFormId).IsRequired(false);
            builder.HasOne(a => a.Form).WithMany(c => c.WorkFlowTypes).HasForeignKey(c => c.RecordFormId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
