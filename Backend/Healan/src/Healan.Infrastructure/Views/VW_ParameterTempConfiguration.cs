using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class VW_ParameterTempConfiguration : IEntityTypeConfiguration<VW_ParameterTemp>
    {
        public void Configure(EntityTypeBuilder<VW_ParameterTemp> builder)
        {
            builder.ToView("VW_ParameterTemp");
            builder.HasNoKey();
            //builder.Metadata.IsTableExcludedFromMigrations();

        }
    }
}
