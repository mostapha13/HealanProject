using FileManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Share.Domain.Enums;
using System;
using System.Linq;

namespace FileManager.Infrastructure.Persistence.Configurations
{
    public class FileTypeConfiguration : IEntityTypeConfiguration<FileType>
    {
        public void Configure(EntityTypeBuilder<FileType> builder)
        {
            builder.ToTable("FileType");

            builder.Property(e => e.Id).ValueGeneratedNever();

            builder.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(512)
                .IsUnicode(true);

            builder.Property(e => e.Id)
                    .HasConversion<short>();

            builder.HasData(
                    Enum.GetValues(typeof(FileTypeId))
                        .Cast<FileTypeId>()
                        .Select(e => new FileType()
                        {
                            Id = e,
                            Name = e.ToString()
                        })
                    );
        }
    }
}
