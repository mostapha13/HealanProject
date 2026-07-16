using Healan.Domain.Sms.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Sms.Configs;

public class SmsSettingConfiguration : IEntityTypeConfiguration<SmsSetting>
{
    public void Configure(EntityTypeBuilder<SmsSetting> builder)
    {
        builder.ToTable("SmsSettings");
        builder.HasKey(x => x.SmsSettingId);
        builder.Property(x => x.SmsSettingId).ValueGeneratedNever();
        builder.Property(x => x.ApiKey).HasMaxLength(200).IsRequired();
        builder.Property(x => x.VerifyParameterName).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TemplateId).HasDefaultValue(640023);
        builder.Property(x => x.LineNumber).HasDefaultValue(0L);
        builder.Property(x => x.SendEnabled).HasDefaultValue(true);
    }
}
