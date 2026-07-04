using Healan.Domain.Insurances.Entities;
using Healan.Domain.Invoices.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Insurances.Configs;

public class InsuranceContractServiceConfiguration : IEntityTypeConfiguration<InsuranceContractService>
{
    public void Configure(EntityTypeBuilder<InsuranceContractService> builder)
    {
        builder.ToTable("InsuranceContractServices");
        builder.HasKey(s => s.InsuranceContractServiceId);

        builder.HasMany(s => s.InvoiceItems)
               .WithOne(s=>s.InsuranceContractService)
               .HasForeignKey(i => i.InsuranceContractServiceId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.ServiceType)
               .WithMany(s => s.InsuranceContractServices)
               .HasForeignKey(s => s.ServiceTypeId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.InsuranceContract)
         .WithMany(s => s.InsuranceContractServices)
         .HasForeignKey(s => s.InsuranceContractId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}