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
    public class SubSystemInfoConfiguration : IEntityTypeConfiguration<SubSystemInfo>
    {
        public void Configure(EntityTypeBuilder<SubSystemInfo> builder)
        {
            builder.HasKey(a => a.SubSystemInfoId);
            builder.Property(a => a.SubSystemInfoId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedOnAdd();

            builder.Property(a => a.SubSystemInfoName).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.DisplayName).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.DisplayOrder).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();
        }
    }
}
