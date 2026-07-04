using Healan.Domain.PublicInfos.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Infrastructure.ServiceTypes.Configs;
public class ServiceTypeConfiguration : IEntityTypeConfiguration<ServiceType>
{
    public void Configure(EntityTypeBuilder<ServiceType> builder)
    {
        builder.ToTable("ServiceTypes");

        builder.HasKey(p => p.ServiceTypeId);
        builder.Property(p => p.ServiceTypeId).HasColumnType("bigint").ValueGeneratedOnAdd();

        builder.Property(a => a.Title).IsRequired().HasMaxLength(200).HasComment("عنوان");
        builder.Property(a => a.Code).HasMaxLength(50).HasComment("کد");
        builder.Property(a => a.CategoryTypeId).IsRequired().HasComment("دسته بندی");
        builder.Property(a => a.Description).HasMaxLength(1000).HasComment("توضیحات");

        builder.HasMany(s => s.MedicalFeeServices)
       .WithOne(m => m.ServiceType)
       .HasForeignKey(m => m.ServiceTypeId)
       .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.InvoiceItems)
               .WithOne(ii => ii.ServiceType)
               .HasForeignKey(ii => ii.ServiceTypeId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(a => a.Appointments).WithMany(p => p.ServiceTypes);

    }
}

