using IdentityServer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IdentityServer.Domain.Configuration
{
    public class ImpersonationAuditConfiguration : IEntityTypeConfiguration<ImpersonationAudit>
    {
        public void Configure(EntityTypeBuilder<ImpersonationAudit> builder)
        {
            builder.ToTable("ImpersonationAudits");
            builder.HasKey(x => x.ImpersonationAuditId);
            builder.Property(x => x.ImpersonationAuditId).ValueGeneratedOnAdd();
            builder.Property(x => x.ActorUserId).IsRequired();
            builder.Property(x => x.TargetUserId).IsRequired();
            builder.Property(x => x.SessionId).IsRequired();
            builder.Property(x => x.OccurredAtUtc).HasColumnType("datetime2").IsRequired();
            builder.Property(x => x.IpAddress).HasMaxLength(45).IsRequired();
            builder.Property(x => x.Event).HasMaxLength(16).IsRequired();
            builder.HasIndex(x => new { x.SessionId, x.Event }).IsUnique();
            builder.HasIndex(x => x.ActorUserId);
            builder.HasIndex(x => x.TargetUserId);
        }
    }
}
