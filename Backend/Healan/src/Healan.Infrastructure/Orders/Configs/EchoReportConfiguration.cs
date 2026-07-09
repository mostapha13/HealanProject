using Healan.Domain.Orders.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Orders.Configs;

public class EchoReportConfiguration : IEntityTypeConfiguration<EchoReport>
{
    public void Configure(EntityTypeBuilder<EchoReport> builder)
    {
        builder.ToTable("EchoReports");
        builder.HasKey(x => x.EchoReportId);
        builder.HasIndex(x => x.PrescriptionId).IsUnique();

        builder.Property(x => x.Phm).HasMaxLength(500);
        builder.Property(x => x.Conclusion).HasMaxLength(4000);
        builder.Property(x => x.Recommendation).HasMaxLength(4000);

        // اندازه‌گیری‌ها — همه اختیاری، max 100
        string[] measureProps =
        [
            nameof(EchoReport.Rvid), nameof(EchoReport.Lvidd), nameof(EchoReport.Lvids),
            nameof(EchoReport.Ivsd), nameof(EchoReport.Pwd), nameof(EchoReport.Lvef),
            nameof(EchoReport.SimpsonEf), nameof(EchoReport.LvMass), nameof(EchoReport.Sm),
            nameof(EchoReport.TelIndex), nameof(EchoReport.AvAnnulus), nameof(EchoReport.SinusValsalva),
            nameof(EchoReport.StJunction), nameof(EchoReport.Acs), nameof(EchoReport.AscAo),
            nameof(EchoReport.LaArea), nameof(EchoReport.LaDia), nameof(EchoReport.LaVolume),
            nameof(EchoReport.Edv), nameof(EchoReport.Esv), nameof(EchoReport.Mve),
            nameof(EchoReport.Mva), nameof(EchoReport.Mvdt), nameof(EchoReport.Mvpht),
            nameof(EchoReport.MvMean), nameof(EchoReport.MvArea), nameof(EchoReport.MvAnnulus),
            nameof(EchoReport.PvsMax), nameof(EchoReport.PvdMax), nameof(EchoReport.DtiEm),
            nameof(EchoReport.DtiAm), nameof(EchoReport.AovMax), nameof(EchoReport.LvotVmax),
            nameof(EchoReport.LvotVti), nameof(EchoReport.AvVti), nameof(EchoReport.AoPeak),
            nameof(EchoReport.AoMean), nameof(EchoReport.Ava), nameof(EchoReport.At),
            nameof(EchoReport.AovMg), nameof(EchoReport.AovPg), nameof(EchoReport.TrgMax),
            nameof(EchoReport.Rvsp), nameof(EchoReport.Pap), nameof(EchoReport.TvMean),
            nameof(EchoReport.TvAnnulus), nameof(EchoReport.TvMg), nameof(EchoReport.TvPg),
            nameof(EchoReport.PvMax), nameof(EchoReport.PvPg), nameof(EchoReport.PvVti),
            nameof(EchoReport.RvotVti), nameof(EchoReport.Piphi), nameof(EchoReport.Ivc),
            nameof(EchoReport.RaArea), nameof(EchoReport.SeptalE), nameof(EchoReport.LateralE),
            nameof(EchoReport.SPrime), nameof(EchoReport.APrime), nameof(EchoReport.SmTdi),
            nameof(EchoReport.Tapsie),
        ];

        foreach (var name in measureProps)
            builder.Property(name).HasMaxLength(100);

        builder.HasOne(x => x.Prescription)
            .WithOne(p => p.EchoReport)
            .HasForeignKey<EchoReport>(x => x.PrescriptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
