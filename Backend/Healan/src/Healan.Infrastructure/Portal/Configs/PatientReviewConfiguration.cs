using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class PatientReviewConfiguration : IEntityTypeConfiguration<PatientReview>
{
    public void Configure(EntityTypeBuilder<PatientReview> builder)
    {
        builder.ToTable("PatientReviews");
        builder.HasKey(x => x.PatientReviewId);
        builder.Property(x => x.PatientReviewId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.DisplayName).IsRequired().HasMaxLength(200);
        builder.Property(x => x.ContactInfo).IsRequired().HasMaxLength(200);
        builder.Property(x => x.ReviewText).IsRequired().HasMaxLength(2000);
        builder.Property(x => x.Rating).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.AdminNote).HasMaxLength(1000);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => new { x.Status, x.SortOrder });
    }
}
