using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{
    public class CashMarketCardBoardArchivesViewConfiguration : IEntityTypeConfiguration<CashMarketCardBoardArchivesView>
    {
        public void Configure(EntityTypeBuilder<CashMarketCardBoardArchivesView> builder)
        {
            builder.ToView("CashMarketCardBoardArchivesView");
            builder.HasKey(c => c.ROW_NUM);
            //builder.Metadata.IsTableExcludedFromMigrations();

            /*
            builder.Property(t => t.ROW_NUM).HasColumnName("ROW_NUM");
            builder.Property(t => t.IsDeleted).HasColumnName("ISDELETED");
            builder.Property(t => t.OrderStatusId).HasColumnName("ORDERSTATUSID");
            builder.Property(t => t.OrderStatusName).HasColumnName("ORDERSTATUSNAME");
            builder.Property(t => t.WorkFlowDate).HasColumnName("WORKFLOWDATE");
            builder.Property(t => t.WorkFlowTypeId).HasColumnName("WORKFLOWTYPEID");
            builder.Property(t => t.WorkFlowName).HasColumnName("WORKFLOWNAME");
            builder.Property(t => t.BrokerId).HasColumnName("BROKERID");
            builder.Property(t => t.BackwardClass).HasColumnName("BACKWARDCLASS");
            builder.Property(t => t.ForwardClass).HasColumnName("FORWARDCLASS");
            builder.Property(t => t.FormName).HasColumnName("FORMNAME");
            builder.Property(t => t.FormUrl).HasColumnName("FoRmUrl");
            builder.Property(t => t.FormId).HasColumnName("FORMID");
            builder.Property(t => t.HasObserved).HasColumnName("HASOBSERVED");           
            builder.Property(t => t.TrackingNumber).HasColumnName("TRACKINGNUMBER");
            builder.Property(t => t.InstrumentId).HasColumnName("INSTRUMENTID");
            builder.Property(t => t.SymbolName).HasColumnName("SYMBOLNAME");
            builder.Property(t => t.OrderId).HasColumnName("ORDERID");
            builder.Property(t => t.ReceiverGroupName).HasColumnName("RECEIVERGROUPNAME");
            builder.Property(t => t.ReceiverGroupId).HasColumnName("RECEIVERGROUPID");
            builder.Property(t => t.SenderGroupName).HasColumnName("SENDERGROUPNAME");
            builder.Property(t => t.SenderGroupId).HasColumnName("SENDERGROUPID");
            builder.Property(t => t.WorkFlowDate).HasColumnName("WORKFLOWDATE");
            builder.Property(t => t.WorkFlowArchiveDate).HasColumnName("WORKFLOWARCHIVEDATE");

            */
        }
    }
}
