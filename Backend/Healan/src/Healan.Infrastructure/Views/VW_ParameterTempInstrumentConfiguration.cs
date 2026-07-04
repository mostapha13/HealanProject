using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class VW_ParameterTempInstrumentConfiguration : IEntityTypeConfiguration<VW_ParameterTempInstrument>
    {
        public void Configure(EntityTypeBuilder<VW_ParameterTempInstrument> builder)
        {
            builder.ToView("VW_ParameterTempInstrument");
            builder.HasNoKey();

        }
    }
}
