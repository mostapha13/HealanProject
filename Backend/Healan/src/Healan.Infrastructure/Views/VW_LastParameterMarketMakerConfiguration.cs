using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class VW_LastParameterMarketMakerConfiguration : IEntityTypeConfiguration<VW_LastParameterMarketMaker>
    {
        public void Configure(EntityTypeBuilder<VW_LastParameterMarketMaker> builder)
        {
            builder.ToView("VW_LastParameterMarketMaker");
            builder.HasNoKey();
            //builder.Metadata.IsTableExcludedFromMigrations();

        }
    }
}
