using Healan.Domain.Invoices.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Infrastructure.Invoices.Configs;
public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("Invoice");

        builder.HasKey(p => p.InvoiceId);
        builder.Property(p => p.InvoiceId).HasColumnType("bigint").ValueGeneratedOnAdd();

        builder.Property(a => a.AppointmentId).IsRequired().HasComment("کد نوبت");
        builder.Property(a => a.InvoiceStatusTypeId).IsRequired().HasComment("وضعیت صورت حساب");
        builder.Property(a => a.TotalAmount).HasColumnType("decimal(18,2)").IsRequired().HasComment("مبلغ کل");
        builder.Property(a => a.PrimaryInsuranceCovered).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValue(0).HasComment("پوشش بیمه اصلی");
        builder.Property(a => a.SecondaryInsuranceCovered).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValue(0).HasComment("پوشش بیمه تمکیلی");
        builder.Property(a => a.PatientPayable)
            .HasColumnType("decimal(18,2)")
            .HasComputedColumnSql("[TotalAmount]-([PrimaryInsuranceCovered]+[SecondaryInsuranceCovered])", stored:true).HasComment("سهم بیمار");



        builder.HasOne(a => a.Appointment).WithMany(b => b.Invoices).HasForeignKey(c => c.AppointmentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(a => a.InvoiceItems).WithOne(b => b.Invoice).HasForeignKey(c => c.InvoiceId).OnDelete(DeleteBehavior.Restrict);

    }
}
