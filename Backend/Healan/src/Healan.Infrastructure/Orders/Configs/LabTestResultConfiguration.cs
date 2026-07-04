using Healan.Domain.Orders.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Orders.Configs;

public class LabTestResultConfiguration : IEntityTypeConfiguration<LabTestResult>
{
    public void Configure(EntityTypeBuilder<LabTestResult> builder)
    {
        builder.ToTable("LabTestResults");
        builder.HasKey(r => r.LabTestResultId);

        builder.Property(r => r.LabResultData).HasMaxLength(1000);
    }
}
