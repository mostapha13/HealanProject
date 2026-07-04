using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class UserCardboardRecordView_historyConfiguration : IEntityTypeConfiguration<UserCardboardRecordView_history>
    {
        public void Configure(EntityTypeBuilder<UserCardboardRecordView_history> builder)
        {
            //builder.ToView("UserCardboardRecordView_history");
            //builder.HasKey(e => e.row_num);


            builder.ToView("UserCardboardRecordView_history");
            builder.HasNoKey();

        }
    }
}
