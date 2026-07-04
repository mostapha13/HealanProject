using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class VW_ArchiveParameterMarketMakerConfiguration : IEntityTypeConfiguration<VW_ArchiveParameterMarketMaker>
    {
        public void Configure(EntityTypeBuilder<VW_ArchiveParameterMarketMaker> builder)
        {
            builder.ToView("VW_ArchiveParameterMarketMaker");
            builder.HasNoKey();
            //builder.Metadata.IsTableExcludedFromMigrations();

        }
    }
}
