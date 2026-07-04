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
    public class SectionInfoConfiguration : IEntityTypeConfiguration<SectionInfo>
    {
        public void Configure(EntityTypeBuilder<SectionInfo> builder)
        {
            builder.HasKey(a => a.SectionInfoId);
            builder.Property(a => a.SectionInfoId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedOnAdd();
                
            builder.Property(a => a.SectionInfoName).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.DisplayName).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.DisplayOrder).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();

            builder.HasOne(a => a.SubSystem).WithMany(b => b.SectionInfos).HasForeignKey(c => c.SubSystemId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
