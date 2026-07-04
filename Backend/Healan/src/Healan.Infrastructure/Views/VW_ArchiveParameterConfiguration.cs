using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class VW_ArchiveParameterConfiguration : IEntityTypeConfiguration<VW_ArchiveParameter>
    {
        public void Configure(EntityTypeBuilder<VW_ArchiveParameter> builder)
        {
            builder.ToView("VW_ArchiveParameter");
            builder.HasNoKey();
            //builder.Metadata.IsTableExcludedFromMigrations();

        }
    }
}
