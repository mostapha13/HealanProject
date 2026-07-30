using IdentityServer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IdentityServer.Domain.Configuration;

public sealed class AccessUserDenyConfiguration : IEntityTypeConfiguration<AccessUserDeny>
{
    public void Configure(EntityTypeBuilder<AccessUserDeny> builder)
    {
        builder.ToTable("AccessUserDeny");
        builder.HasKey(x => x.AccessUserDenyId);
        builder.Property(x => x.AccessUserDenyId).ValueGeneratedOnAdd();
        builder.Property(x => x.CreatedUtc).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.HasIndex(x => new { x.UserId, x.AccessSystemId, x.AccessMenuId }).IsUnique();
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.AccessMenu).WithMany().HasForeignKey(x => x.AccessMenuId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.AccessSystem).WithMany().HasForeignKey(x => x.AccessSystemId).OnDelete(DeleteBehavior.Restrict);
    }
}
