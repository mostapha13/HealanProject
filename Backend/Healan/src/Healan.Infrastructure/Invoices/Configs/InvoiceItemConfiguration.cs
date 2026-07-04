using Healan.Domain.Invoices.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Invoices.Configs;

public class InvoiceItemConfiguration : IEntityTypeConfiguration<InvoiceItem>
{
    public void Configure(EntityTypeBuilder<InvoiceItem> builder)
    {
        builder.ToTable("InvoiceItems");

        builder.HasKey(p => p.InvoiceItemId);
        builder.Property(p => p.InvoiceItemId).HasColumnType("bigint").ValueGeneratedOnAdd();

        builder.Property(a => a.InvoiceId).IsRequired().HasComment("کد فاکتور");
        builder.Property(a => a.ServiceTypeId).IsRequired().HasComment("نوع خدمت");
        builder.Property(a => a.UnitPrice).HasColumnType("decimal(18,2)").IsRequired().HasComment("قیمت واحد");
        builder.Property(a => a.Quantity).IsRequired().HasDefaultValue(1).HasComment("تعداد");
        builder.Property(a => a.Amount).HasColumnType("decimal(18,2)")
            .HasComputedColumnSql("[Quantity]*[UnitPrice]", stored:true)
            .HasComment("مبلغ کل");
        builder.Property(a => a.InsuranceContractServiceId).HasDefaultValue(null).HasComment("تعرفه  با بیمه تکمیلی در صورت  دارا بودن بیمه تکمیلی بیمه در قرارداد بیمار");
        builder.Property(a => a.PrimaryInsuranceCovered).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValue(0).HasComment("پوشش بیمه اصلی");
        builder.Property(a => a.SecondaryInsuranceCovered).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValue(0).HasComment("پوشش بیمه تمکیلی");
        
        builder.Property(a => a.PatientPayable)
            .HasColumnType("decimal(18,2)")
            .HasComputedColumnSql("([Quantity]*[UnitPrice])-([PrimaryInsuranceCovered]+[SecondaryInsuranceCovered])", stored: true).HasComment("سهم بیمار");


        builder.HasOne(x=>x.Invoice).WithMany(x=>x.InvoiceItems).HasForeignKey(x=>x.InvoiceId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ServiceType).WithMany(x => x.InvoiceItems).HasForeignKey(x => x.ServiceTypeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.InsuranceContractService).WithMany(x => x.InvoiceItems).HasForeignKey(x => x.InsuranceContractServiceId).OnDelete(DeleteBehavior.Restrict);

    }
}


