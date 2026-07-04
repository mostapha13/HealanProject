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
    public class AccessRoleConfiguration : IEntityTypeConfiguration<AccessRole>
    {
        public void Configure(EntityTypeBuilder<AccessRole> builder)
        {
            builder.ToTable("AccessRole");
            builder.HasKey(a => a.AccessRoleId);
            builder.Property(a => a.AccessRoleId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedOnAdd();
            builder.Property(a => a.AccessMenuId).IsRequired();
            builder.Property(a => a.RoleId).IsRequired();
            builder.HasOne(a => a.AccessMenu).WithMany(b => b.AccessRoles).HasForeignKey(c => c.AccessMenuId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
