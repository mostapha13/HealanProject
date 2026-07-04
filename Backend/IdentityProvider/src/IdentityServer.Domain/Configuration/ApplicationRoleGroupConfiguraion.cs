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
    public class ApplicationRoleGroupConfiguraion : IEntityTypeConfiguration<ApplicationRoleGroup>
    {
        public void Configure(EntityTypeBuilder<ApplicationRoleGroup> builder)
        {
            builder.HasKey(a => a.ApplicationRoleGroupId);
            builder.Property(a => a.ApplicationRoleGroupId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).ValueGeneratedOnAdd();

            builder.Property(a => a.ApplicationRoleGroupName).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.DisplayName).HasColumnType("nvarchar(100)").IsRequired();
            builder.Property(a => a.DisplayOrder).HasColumnType(nameof(System.Data.SqlDbType.Int)).IsRequired();
        }
    }
}
