using Healan.Domain.Insurances.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Insurances.Configs;

public class InsuranceCompanyConfiguration : IEntityTypeConfiguration<InsuranceCompany>
{
    public void Configure(EntityTypeBuilder<InsuranceCompany> builder)
    {
        builder.ToTable("InsuranceCompanies");
        builder.HasKey(ic => ic.InsuranceCompanyId);
        builder.Property(ic => ic.Name).IsRequired().HasMaxLength(200);



        builder.HasMany(ic => ic.InsuranceContracts)
               .WithOne(c => c.InsuranceCompany)
               .HasForeignKey(c => c.InsuranceCompanyId)
               .OnDelete(DeleteBehavior.Restrict);

 

    }
}
