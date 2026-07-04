using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class workflow_FundConfiguration : IEntityTypeConfiguration<workflow_Fund>
    {
        public void Configure(EntityTypeBuilder<workflow_Fund> builder)
        {
            builder.HasNoKey();
            builder.ToView("workflow_Fund");

        }
    }
}
