using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class WorkFlowAndArchiveViewConfiguration : IEntityTypeConfiguration<WorkFlowAndArchiveView>
    {
        public void Configure(EntityTypeBuilder<WorkFlowAndArchiveView> builder)
        {
            //builder.ToView("WorkFlowAndArchiveView");
            //builder.HasKey(e => e.row_num);
            
            builder.ToView("WorkFlowAndArchiveView");
            builder.HasNoKey();
        }
    }
}
