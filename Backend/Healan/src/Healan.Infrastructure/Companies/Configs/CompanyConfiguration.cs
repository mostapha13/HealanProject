using Healan.Domain.Companies.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Companies.Configs;
public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");

        builder.HasKey(c => c.CompanyId);

        builder.Property(c => c.CompanyName).IsRequired().HasMaxLength(200);
        builder.Property(c => c.LatinCompanyName).HasMaxLength(200);
        builder.Property(c => c.NationalId).HasMaxLength(50);
        builder.Property(c => c.WebSite).HasMaxLength(200);
        builder.Property(c => c.Email).HasMaxLength(100);
        builder.Property(c => c.RegistrationNumber).HasMaxLength(50);
        builder.Property(c => c.Landline).HasMaxLength(15);
        builder.Property(c => c.PrefixNumber).HasMaxLength(10);
        builder.Property(c => c.Address).HasMaxLength(500);

        builder.HasMany(c => c.ChildCompanies)
               .WithOne(c => c.ParentCompany)
               .HasForeignKey(c => c.ParentCompanyRef)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Doctors)
               .WithOne(d => d.Company)
               .HasForeignKey(d => d.CompanyId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Attachment)
               .WithMany()
               .HasForeignKey(c => c.AttachmentId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.CompanyRegistrationType)
               .WithMany(t => t.Companies)
               .HasForeignKey(c => c.CompanyRegistrationTypeId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}