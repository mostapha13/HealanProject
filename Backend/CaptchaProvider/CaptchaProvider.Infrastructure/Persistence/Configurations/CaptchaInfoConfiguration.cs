
using CaptchaProvider.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CaptchaProvider.Infrastructure.Persistence.Configurations
{
    public class CaptchaInfoConfiguration : IEntityTypeConfiguration<CaptchaInfo>
    {
        public void Configure(EntityTypeBuilder<CaptchaInfo> builder)
        {
            builder.ToTable("CaptchaInfo");
            builder.HasKey(a => a.CaptchaInfoId);
            builder.Property(a => a.CaptchaInfoId).HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier)).IsRequired().ValueGeneratedOnAdd();
            builder.Property(a => a.Code).HasColumnType("nvarchar(150)").IsRequired();
            builder.Property(a => a.RequestTime).HasColumnType(nameof(System.Data.SqlDbType.SmallDateTime)).IsRequired();
            builder.Property(a => a.RequestIp).HasColumnType("nvarchar(20)").IsRequired();
            builder.Property(a => a.Result).HasColumnType("nvarchar(50)");
        }
    }
}
