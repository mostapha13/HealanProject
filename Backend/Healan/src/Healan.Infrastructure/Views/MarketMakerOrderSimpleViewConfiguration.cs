using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class MarketMakerOrderSimpleViewConfiguration : IEntityTypeConfiguration<MarketMakerOrderSimpleView>
    {
        public void Configure(EntityTypeBuilder<MarketMakerOrderSimpleView> builder)
        {
            //builder.ToView("MarketMakerOrderSimpleView");
            //builder.HasKey(e => e.row_num); 

            builder.ToView("MarketMakerOrderSimpleView");
            builder.HasNoKey();
        }
    }
}
