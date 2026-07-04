using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class InstrumentParameterTempViewConfiguration : IEntityTypeConfiguration<InstrumentParameterTempView>
    {
        public void Configure(EntityTypeBuilder<InstrumentParameterTempView> builder)
        {
            //builder.ToView("InstrumentParameterTempView");
            //builder.HasKey(e => e.row_num); 

            builder.ToView("InstrumentParameterTempView");
            builder.HasNoKey();
        }
    }
}
