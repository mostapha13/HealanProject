using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class Workflow_WorkFlowUserConfiguration : IEntityTypeConfiguration<Workflow_WorkFlowUser>
    {
        public void Configure(EntityTypeBuilder<Workflow_WorkFlowUser> builder)
        {
            builder.HasNoKey();
            builder.ToView("workflow_WorkFlowUser");

        }
    }
}
