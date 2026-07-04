using IdentityServer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Configuration
{
    public class ActionInfoConfiguration : IEntityTypeConfiguration<ActionInfo>
    {
        public void Configure(EntityTypeBuilder<ActionInfo> builder)
        {
            builder.HasKey(a => a.ActionInfoId);
            builder.Property(a => a.ActionInfoId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedOnAdd();
            builder.Property(a => a.SectionInfoId).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();
            builder.Property(a => a.ActionInfoName).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.DisplayName).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.DisplayOrder).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();

            builder.HasOne(a => a.SectionInfo).WithMany(b => b.ActionInfos).HasForeignKey(c => c.SectionInfoId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
