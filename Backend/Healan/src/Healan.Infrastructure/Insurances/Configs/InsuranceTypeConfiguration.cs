using Healan.Domain.Insurances.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Insurances.Configs;

public class InsuranceTypeConfiguration : IEntityTypeConfiguration<InsuranceType>
{
    public void Configure(EntityTypeBuilder<InsuranceType> builder)
    {
        builder.ToTable("InsuranceTypes");
        builder.HasKey(it => it.InsuranceTypeId);
        builder.Property(it => it.InsuranceTypeName).IsRequired().HasMaxLength(100);
    }
}