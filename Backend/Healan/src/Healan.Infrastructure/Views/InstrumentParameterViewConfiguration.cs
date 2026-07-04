using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class InstrumentParameterViewConfiguration : IEntityTypeConfiguration<InstrumentParameterView>
    {
        public void Configure(EntityTypeBuilder<InstrumentParameterView> builder)
        {
            //builder.ToView("InstrumentParameterView");
            //builder.HasKey(e => e.row_num); 

            builder.ToView("InstrumentParameterView");
            builder.HasNoKey();
        }
    }
}
