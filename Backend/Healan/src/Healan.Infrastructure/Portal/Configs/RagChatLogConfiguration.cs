using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class RagChatLogConfiguration : IEntityTypeConfiguration<RagChatLog>
{
    public void Configure(EntityTypeBuilder<RagChatLog> builder)
    {
        builder.ToTable("RagChatLogs");
        builder.HasKey(x => x.RagChatLogId);
        builder.Property(x => x.RagChatLogId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.Question).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.Answer).HasColumnType("nvarchar(max)");
        builder.Property(x => x.SourceType).HasMaxLength(50);
        builder.Property(x => x.SessionId).HasMaxLength(64);
        builder.HasIndex(x => x.CreatedAt);
    }
}
