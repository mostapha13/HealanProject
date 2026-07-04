using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Newtonsoft.Json;
using Notification.Application.Domain.Entities;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Infrastructure.Persistence.Configurations
{
    public class NotificationConfiguration : IEntityTypeConfiguration<NotificationInfo>
    {
        public void Configure(EntityTypeBuilder<NotificationInfo> builder)
        {
            builder.ToTable("NotificationInfo");
            builder.HasKey(a => a.NotificationInfoId);
            builder.Property(a => a.NotificationInfoId).ValueGeneratedOnAdd().HasColumnType(nameof(System.Data.SqlDbType.UniqueIdentifier));
            builder.Property(a => a.InstrumentId);
            builder.Property(a => a.AccessSystemId).IsRequired().HasDefaultValue(AccessSystemId.MarketMaker);
            builder.Property(a => a.OrderId);
            builder.Property(a => a.MessageText).IsRequired();
            builder.Property(a => a.Notif_Date).IsRequired();
            builder.Property(a => a.Creator).IsRequired();

            builder.Property(a => a.ExtraInfo).HasConversion(
      v => JsonConvert.SerializeObject(v),
      v => JsonConvert.DeserializeObject<Dictionary<string, string>>(v)
      );
            builder.OwnsOne(p => p.Instrument, ps =>
            {
                ps.Property(p => p.SymbolCode);
                ps.Property(p => p.Symbol);
                ps.Property(p => p.SymbolName);
                ps.Property(p => p.MarketTypeId);
                ps.Property(p => p.Investment);
                ps.Property(p => p.CompanyName);
            });
        }
    }
}

