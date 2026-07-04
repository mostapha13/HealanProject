using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Users.Configs;

public class UserTypeConfiguration : IEntityTypeConfiguration<UserType>
{
    public void Configure(EntityTypeBuilder<UserType> builder)
    {
        builder.ToTable("UserTypes");

        builder.HasKey(u => u.UserTypeId);
        builder.Property(u=>u.UserTypeName).IsRequired().HasMaxLength(500);
    }
}
