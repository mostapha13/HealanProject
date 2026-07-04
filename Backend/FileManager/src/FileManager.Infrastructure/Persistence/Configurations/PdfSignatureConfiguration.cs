using FileManager.Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FileManager.Infrastructure.Persistence.Configurations;
public class PdfSignatureConfiguration : IEntityTypeConfiguration<PdfSignature>
{
    public void Configure(EntityTypeBuilder<PdfSignature> builder)
    {
        builder.ToTable("PdfSignature");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AttachmentId).IsRequired();
        builder.Property(x => x.CertificationLevel).HasDefaultValue(CertificationLevelType.Zero);
        builder.Property(x => x.Reason).HasMaxLength(250).HasDefaultValue(null);
        builder.Property(x => x.Location).HasMaxLength(250).HasDefaultValue(null);
        builder.Property(x => x.ImageDataUrl).HasMaxLength(250).HasDefaultValue(null);
        builder.Property(x => x.Page).HasDefaultValue(1);
        builder.Property(x => x.LowerLeftX).HasDefaultValue(null);
        builder.Property(x => x.LowerLeftY).HasDefaultValue(null);
        builder.Property(x => x.UpperRightX).HasDefaultValue(null);
        builder.Property(x => x.UpperRightY).HasDefaultValue(null);
        builder.Property(x => x.FileName).HasMaxLength(250).HasDefaultValue(null);
        builder.Property(x => x.HashAlgorithm).HasDefaultValue(HashAlgorithmType.SHA1);
        builder.Property(x => x.Digest).HasDefaultValue(null);
        builder.Property(x => x.Certificate).HasDefaultValue(null);
        builder.Property(x => x.SignatureAttachmentId).HasDefaultValue(null);

        
        builder.HasOne(x => x.ParentPdfSignature).WithMany(x => x.ChildPdfSignatures).HasForeignKey(x => x.ParentPdfSignatureId).OnDelete(DeleteBehavior.Restrict);

    }
}
