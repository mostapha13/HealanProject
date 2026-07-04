using FileManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FileManager.Infrastructure.Persistence.Configurations
{
    public class FileConfiguration : IEntityTypeConfiguration<FileManager.Domain.Entities.File>
    {
        public void Configure(EntityTypeBuilder<FileManager.Domain.Entities.File> builder)
        {
            builder.ToTable("File");

            builder.Property(e => e.Id).ValueGeneratedNever();

            builder.Property(e => e.Filename)
                .IsRequired()
                .HasMaxLength(512)
                .IsUnicode(false);

            builder.Property(e => e.OriginalFilename)
                .IsRequired()
                .HasMaxLength(512);

            builder.Property(e => e.SavedFileName)
          .IsRequired()
          .HasMaxLength(512);

            builder.Property(e => e.FileExtension)
        .IsRequired()
        .HasMaxLength(20);

            builder.Property(e => e.JsonInfo).HasColumnType("nvarchar(max)");
            builder.Property(e => e.DownloadedCount).HasColumnType(nameof(System.Data.SqlDbType.BigInt)).HasDefaultValue(0);
            builder.Property(e => e.CreatedAt).HasColumnType(nameof(System.Data.SqlDbType.DateTime));


            builder.HasOne(d => d.FileType)
                .WithMany(p => p.Files)
                .HasForeignKey(d => d.FileTypeId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_File_FileType");

            builder
                .Property(e => e.FileTypeId)
                .HasConversion<short>();
        }
    }
}
