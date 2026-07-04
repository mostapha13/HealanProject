using Healan.Domain.Users.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Users.Configs;
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.UserId);
        builder.Property(u => u.UserId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.LastName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.PhoneNumber).HasMaxLength(15);
        builder.Property(u => u.PersonnelNumber).HasMaxLength(50);
        builder.Property(u => u.Landline).HasMaxLength(15);
        builder.Property(u => u.PrefixNumber).HasMaxLength(10);
        builder.Property(u => u.IsActive).IsRequired();

 
        builder.HasOne(u => u.Company)
               .WithMany(u=>u.Users)
               .HasForeignKey(u => u.CompanyId)
               .OnDelete(DeleteBehavior.Restrict);



        builder.HasMany(u => u.Doctors)
               .WithOne(u=>u.User)
               .HasForeignKey(u => u.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
