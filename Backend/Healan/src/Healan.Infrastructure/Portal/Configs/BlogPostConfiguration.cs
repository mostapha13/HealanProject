using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class BlogPostConfiguration : IEntityTypeConfiguration<BlogPost>
{
    public void Configure(EntityTypeBuilder<BlogPost> builder)
    {
        builder.ToTable("BlogPosts");
        builder.HasKey(x => x.BlogPostId);
        builder.Property(x => x.BlogPostId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Excerpt).HasMaxLength(1000);
        builder.Property(x => x.Body).HasColumnType("nvarchar(max)").IsRequired();
        builder.Property(x => x.CoverImageUrl).HasMaxLength(1000);
        builder.Property(x => x.CoverImageFileId).HasColumnType("uniqueidentifier");
        builder.Property(x => x.IsPublished).HasDefaultValue(true);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => new { x.IsPublished, x.PublishedAt });
    }
}
