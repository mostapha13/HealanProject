using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class RagSettingConfiguration : IEntityTypeConfiguration<RagSetting>
{
    public void Configure(EntityTypeBuilder<RagSetting> builder)
    {
        builder.ToTable("RagSettings");
        builder.HasKey(x => x.RagSettingId);
        builder.Property(x => x.RagSettingId).ValueGeneratedNever();
        builder.Property(x => x.PythonApiUrl).HasMaxLength(500).IsRequired();
        builder.Property(x => x.SyncIntervalMinutes).HasDefaultValue(10);
        builder.Property(x => x.SimilarityThresholdPercent).HasDefaultValue(55);
        builder.Property(x => x.IsEnabled).HasDefaultValue(true);
        builder.Property(x => x.GuestDailyLimit).HasDefaultValue(10);
        builder.Property(x => x.AuthenticatedDailyLimit).HasDefaultValue(200);
        builder.Property(x => x.EmbeddingModel).HasMaxLength(200).HasDefaultValue("heydariAI/persian-embeddings");
        builder.Property(x => x.SummarizeModel).HasMaxLength(200).HasDefaultValue("qwen2.5:3b");
        builder.Property(x => x.SttModel).HasMaxLength(200).HasDefaultValue("small");
    }
}
