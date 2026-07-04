using Healan.Domain.Insurances.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Insurances.Configs;

public class InsuranceContractConfiguration : IEntityTypeConfiguration<InsuranceContract>
{
    public void Configure(EntityTypeBuilder<InsuranceContract> builder)
    {
        builder.ToTable("InsuranceContracts");
        builder.HasKey(c => c.InsuranceContractId);

        builder.Property(c => c.ContractNumber).HasMaxLength(100);
        builder.Property(c => c.StartDate).IsRequired();



        builder.HasOne(c => c.InsuranceCompany)
               .WithMany(ic => ic.InsuranceContracts)
               .HasForeignKey(c => c.InsuranceCompanyId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.InsuranceContractServices)
                .WithOne(s => s.InsuranceContract)
                .HasForeignKey(s => s.InsuranceContractId)
                .OnDelete(DeleteBehavior.Restrict);

    }
}