using IdentityServer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IdentityServer.Domain.Configuration
{
    public class AccessSystemRoleConfiguration : IEntityTypeConfiguration<AccessSystemRole>
    {
        public void Configure(EntityTypeBuilder<AccessSystemRole> builder)
        {
            builder.ToTable("AccessSystemRole");
            builder.HasKey(a => a.AccessSystemRoleId);
            builder.Property(a => a.AccessSystemRoleId).HasColumnType(nameof(System.Data.SqlDbType.Int)).ValueGeneratedOnAdd();
            builder.Property(a => a.AccessSystemId).IsRequired();
            builder.Property(a => a.RoleId).IsRequired();
            builder.HasOne(a => a.AccessSystem).WithMany(b => b.AccessSystemRoles).HasForeignKey(c => c.AccessSystemId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.ApplicationRole).WithMany(b => b.AccessSystemRoles).HasForeignKey(c => c.RoleId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
