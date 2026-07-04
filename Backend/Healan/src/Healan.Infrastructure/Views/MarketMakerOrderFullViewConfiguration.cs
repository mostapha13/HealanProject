using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class MarketMakerOrderFullViewConfiguration : IEntityTypeConfiguration<MarketMakerOrderFullView>
    {
        public void Configure(EntityTypeBuilder<MarketMakerOrderFullView> builder)
        {
            //builder.ToView("MarketMakerOrderFullView");
            //builder.HasKey(e => e.row_num); 

            builder.ToView("MarketMakerOrderFullView");
            builder.HasNoKey();
        }
    }
}
