using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class VW_LastParameterConfiguration : IEntityTypeConfiguration<VW_LastParameter>
    {
        public void Configure(EntityTypeBuilder<VW_LastParameter> builder)
        {
            builder.ToView("VW_LastParameter");
            builder.HasNoKey();
            //builder.Metadata.IsTableExcludedFromMigrations();

        }
    }
}
