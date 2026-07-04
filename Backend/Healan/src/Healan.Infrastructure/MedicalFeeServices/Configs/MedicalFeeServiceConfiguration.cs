using Healan.Domain.MedicalFeeServices.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.MedicalFeeServices.Configs;
public class MedicalFeeServiceConfiguration : IEntityTypeConfiguration<MedicalFeeService>
{
    public void Configure(EntityTypeBuilder<MedicalFeeService> builder)
    {
        builder.ToTable("MedicalFeeServices");

        builder.HasKey(p => p.MedicalFeeServiceId);
        builder.Property(p => p.MedicalFeeServiceId).HasColumnType("bigint").ValueGeneratedOnAdd();

        builder.Property(a => a.StartDate).IsRequired().HasComment("از تاریخ");
        builder.Property(a => a.EndDate).HasComment("تا تاریخ");
        builder.Property(a => a.IsActive).HasDefaultValue(true).HasComment("فعال/غیرفعال"); ;
        builder.Property(a => a.Price).IsRequired().HasComment("مبلغ تعرفه"); ;


        builder.HasOne(a => a.ServiceType).WithMany(b => b.MedicalFeeServices).HasForeignKey(c => c.ServiceTypeId).OnDelete(DeleteBehavior.Restrict);

    }
}
