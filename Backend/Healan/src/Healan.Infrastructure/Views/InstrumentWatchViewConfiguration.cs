using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class InstrumentWatchViewConfiguration : IEntityTypeConfiguration<InstrumentWatchView>
    {
        public void Configure(EntityTypeBuilder<InstrumentWatchView> builder)
        {
            //builder.ToView("InstrumentWatchView");
            //builder.HasKey(e => e.row_num); 


            builder.ToView("InstrumentWatchView");
            builder.HasNoKey();

        }
    }
}
