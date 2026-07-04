using WorkFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace WorkFlow.Infrastructure.Persistence.Configuration
{
    public class WorkFlowStatusGuideConfiguration : IEntityTypeConfiguration<WorkFlowStatusGuide>
    {
        public void Configure(EntityTypeBuilder<WorkFlowStatusGuide> builder)
        {
            builder.ToTable("WorkFlowStatusGuide");
            builder.HasKey(x => x.Id);
            builder.Property(t => t.OrderStatusId).HasColumnName("OrderStatusId");
            builder.Property(t => t.GuideId).HasColumnName("GuideId");

            builder.HasOne(x => x.WorkFlowGuide).WithMany(x => x.WorkFlowStatusGuides).HasForeignKey(x => x.GuideId);
            builder.HasOne(x => x.OrderStatus).WithMany(x => x.WorkFlowStatusGuides).HasForeignKey(x => x.OrderStatusId);
        }
    }
}
