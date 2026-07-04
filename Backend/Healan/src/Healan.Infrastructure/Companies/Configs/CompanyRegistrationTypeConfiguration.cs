using Healan.Domain.Companies.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Companies.Configs;
public class CompanyRegistrationTypeConfiguration : IEntityTypeConfiguration<CompanyRegistrationType>
{
    public void Configure(EntityTypeBuilder<CompanyRegistrationType> builder)
    {
        builder.ToTable("CompanyRegistrationTypes");

        builder.HasKey(t => t.CompanyRegistrationTypeId);

        builder.Property(t => t.CompanyRegistrationTypeName).IsRequired().HasMaxLength(100);

        builder.HasMany(t => t.Companies)
               .WithOne(c => c.CompanyRegistrationType)
               .HasForeignKey(c => c.CompanyRegistrationTypeId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}