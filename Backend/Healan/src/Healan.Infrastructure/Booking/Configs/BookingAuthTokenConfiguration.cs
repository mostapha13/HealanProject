using Healan.Domain.Booking.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Booking.Configs;

public class BookingAuthTokenConfiguration : IEntityTypeConfiguration<BookingAuthToken>
{
    public void Configure(EntityTypeBuilder<BookingAuthToken> builder)
    {
        builder.ToTable("BookingAuthTokens");
        builder.HasKey(x => x.TokenKey);
        builder.Property(x => x.TokenKey).HasMaxLength(128);
        builder.Property(x => x.TokenValue).HasMaxLength(64).IsRequired();
        builder.HasIndex(x => x.ExpiresAtUtc);
    }
}
