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
    public class AccessSystemConfiguration : IEntityTypeConfiguration<AccessSystem>
    {
        public void Configure(EntityTypeBuilder<AccessSystem> builder)
        {
            builder.ToTable("AccessSystem");
            builder.HasKey(a => a.AccessSystemId);
            builder.Property(a => a.AccessSystemId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedOnAdd();
            builder.Property(a => a.SystemName).IsRequired().HasMaxLength(150);
            builder.Property(a => a.SystemTitle).IsRequired().HasMaxLength(200);

            

        }
    }
}
