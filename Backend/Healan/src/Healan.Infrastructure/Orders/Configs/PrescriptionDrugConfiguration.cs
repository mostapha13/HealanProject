using Healan.Domain.Orders.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Orders.Configs;

public class PrescriptionDrugConfiguration : IEntityTypeConfiguration<PrescriptionDrug>
{
    public void Configure(EntityTypeBuilder<PrescriptionDrug> builder)
    {
        builder.ToTable("PrescriptionDrugs");
        builder.HasKey(p => p.PrescriptionDrugId);
        builder.Property(d => d.DrugName).HasMaxLength(150).IsRequired();
        builder.Property(d => d.Dosage).HasMaxLength(50).IsRequired();
        builder.Property(d => d.UsageInstructions).HasMaxLength(1500);

        builder.HasOne(d => d.Prescription).WithMany(d => d.PrescriptionDrugs).HasForeignKey(d => d.PrescriptionId).OnDelete(DeleteBehavior.Restrict);
    }
}