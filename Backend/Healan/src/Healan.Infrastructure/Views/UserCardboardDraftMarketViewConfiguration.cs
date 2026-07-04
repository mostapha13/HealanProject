using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{
    public class UserCardboardDraftMarketViewConfiguration : IEntityTypeConfiguration<UserCardboardDraftMarketView>
    {
        public void Configure(EntityTypeBuilder<UserCardboardDraftMarketView> builder)
        {
            builder.ToView("USERCARDBOARDDRAFTMARKETVIEW");
            builder.HasKey(c => c.row_num);
            //builder.Metadata.IsTableExcludedFromMigrations();

            /*
            builder.Property(t => t.ROW_NUM).HasColumnName("ROW_NUM");
            builder.Property(t => t.IsDeleted).HasColumnName("ISDELETED");
            builder.Property(t => t.OrderStatusId).HasColumnName("ORDERSTATUSID");
            builder.Property(t => t.OrderStatusName).HasColumnName("ORDERSTATUSNAME");
            builder.Property(t => t.WorkFlowUserId).HasColumnName("WORKFLOWUSERID");
            builder.Property(t => t.OrderId).HasColumnName("ORDERID");
            builder.Property(t => t.TrackingNumber).HasColumnName("TRACKINGNUMBER");
            builder.Property(t => t.BrokerId).HasColumnName("BROKERID");
            builder.Property(t => t.InstrumentId).HasColumnName("INSTRUMENTID");
            builder.Property(t => t.SymbolName).HasColumnName("SYMBOLNAME");
            builder.Property(t => t.Symbol).HasColumnName("SYMBOL");
            builder.Property(t => t.FirstName).HasColumnName("FIRSTNAME");
            builder.Property(t => t.LastName).HasColumnName("LASTNAME");
            builder.Property(t => t.FormName).HasColumnName("FORMNAME");
            builder.Property(t => t.WorkFlowUserGroupId).HasColumnName("WorkFlowUserGroupId");
            builder.Property(t => t.GroupName).HasColumnName("GroupName");
            builder.Property(t => t.CreateDate).HasColumnName("CREATEDATE");
            builder.Property(t => t.StartForm).HasColumnName("STARTFORM");
            builder.Property(t => t.SearchForm).HasColumnName("SEARCHFORM");
            builder.Property(t => t.FormId).HasColumnName("FORMID");
            */
        }
    }
}
