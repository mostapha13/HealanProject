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
    }
}
