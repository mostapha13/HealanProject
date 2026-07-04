using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Views
{

    public class UserCardboardRecordViewConfiguration : IEntityTypeConfiguration<UserCardboardRecordView>
    {
        public void Configure(EntityTypeBuilder<UserCardboardRecordView> builder)
        {
            //builder.ToView("UserCardboardRecordView");
            //builder.HasKey(e => e.row_num);


            builder.ToView("UserCardboardRecordView");
            builder.HasNoKey();

        }
    }
}
