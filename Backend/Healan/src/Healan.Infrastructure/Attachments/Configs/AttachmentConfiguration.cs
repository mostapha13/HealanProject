

using Healan.Domain.Attachments.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Attachments.Configs;
public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.ToTable("Attachments");
        builder.HasKey(a => a.FileId);
        // FileId comes from FileManager upload — never regenerate or FK to Lab/Imaging breaks.
        builder.Property(a => a.FileId).ValueGeneratedNever();
        builder.Property(a => a.Link).HasMaxLength(500).IsRequired();
        builder.Property(a => a.Title).HasMaxLength(500).HasDefaultValue(null);
        builder.Property(a => a.FileName).HasMaxLength(150).IsRequired();
        builder.Property(a => a.FileType).HasMaxLength(150).IsRequired();
        builder.Property(a => a.SignerUserId).HasDefaultValue(null);
        builder.Property(a => a.SignerFirstName).HasMaxLength(150).HasDefaultValue(null);
        builder.Property(a => a.SignerLastName).HasMaxLength(150).HasDefaultValue(null);
        builder.Property(a => a.ParentId);
    }
}

