using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Notification.Application.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Infrastructure.Persistence.Configurations
{
    public class NotificationUserConfiguration : IEntityTypeConfiguration<NotificationUser>
    {
        public void Configure(EntityTypeBuilder<NotificationUser> builder)
        {
            builder.ToTable("NotificationUser");
            builder.HasKey(a => a.NotificationUserId);
            builder.Property(a => a.NotificationUserId).ValueGeneratedOnAdd().HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
            builder.Property(a => a.NotificationInfoId).IsRequired();
            builder.Property(a => a.UserId).IsRequired();
            builder.Property(a => a.ReadDateTime);
            builder.HasOne(a => a.NotificationInfo).WithMany(b => b.NotificationUsers).HasForeignKey(c => c.NotificationInfoId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
