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
    public class ApplicationUserAccessConfiguration : IEntityTypeConfiguration<ApplicationUserAccess>
    {
        public void Configure(EntityTypeBuilder<ApplicationUserAccess> builder)
        {
            builder.HasKey(a => a.ApplicationUserAccessId);
            builder.Property(a => a.ApplicationUserAccessId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).ValueGeneratedOnAdd();
            builder.Property(a => a.ApplicationRoleGroupId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
            builder.Property(a => a.ApplicationRoleId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
            builder.Property(a => a.ActionInfoId).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();
            builder.Property(a => a.AccessMode).HasColumnType(nameof(System.Data.SqlDbType.TinyInt)).IsRequired();

            builder.HasOne(a => a.ApplicationRoleGroup).WithMany(b => b.ApplicationUserAccesses).HasForeignKey(c => c.ApplicationRoleGroupId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.ApplicationRole).WithMany(b => b.ApplicationUserAccesses).HasForeignKey(c => c.ApplicationRoleId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.ActionInfo).WithMany(b => b.ApplicationUserAccesses).HasForeignKey(c => c.ActionInfoId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
