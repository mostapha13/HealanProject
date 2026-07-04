using Healan.Domain.Invoices.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Infrastructure.Invoices.Configs;
public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");

        builder.HasKey(p => p.PaymentId);

        builder.Property(p => p.TotalAmount).IsRequired();
        builder.Property(p => p.PatientShare).IsRequired();
        builder.Property(p => p.PrimaryInsuranceConvered).IsRequired();
        builder.Property(p => p.SecondaryInsuranceCovered).IsRequired();
        builder.Property(p => p.PaymentReference).HasMaxLength(100);
        builder.Property(p => p.Description).HasMaxLength(500);

        builder.HasOne(p => p.Invoice)
               .WithMany(pm => pm.Payments)
               .HasForeignKey(p => p.InvoiceId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}