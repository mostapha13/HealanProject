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
    public class AccessMenuConfiguration : IEntityTypeConfiguration<AccessMenu>
    {
        public void Configure(EntityTypeBuilder<AccessMenu> builder)
        {
            builder.ToTable("AccessMenu");
            builder.HasKey(a => a.AccessMenuId);
            builder.Property(a => a.AccessMenuId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedOnAdd();
            builder.Property(a => a.AccessFormId);
            builder.Property(a => a.ParentRef);
            builder.Property(a => a.Order).IsRequired();
            builder.Property(a => a.Title).HasMaxLength(200);
            builder.Property(a => a.IsActive).HasDefaultValue(true);


            builder.HasOne(a => a.AccessForm).WithMany(b => b.AccessMenus).HasForeignKey(c => c.AccessFormId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.Parent).WithMany(b => b.Children).HasForeignKey(c => c.ParentRef).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
