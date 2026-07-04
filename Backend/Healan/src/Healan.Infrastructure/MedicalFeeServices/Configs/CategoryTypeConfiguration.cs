using Healan.Domain.MedicalFeeServices.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.MedicalFeeServices.Configs;

public class CategoryTypeConfiguration : IEntityTypeConfiguration<CategoryType>
{
    public void Configure(EntityTypeBuilder<CategoryType> builder)
    {
        builder.ToTable("CategoryTypes");
        builder.HasKey(c => c.CategoryTypeId);
        builder.Property(c => c.CategoryTypeName).IsRequired().HasMaxLength(100);
    }
}