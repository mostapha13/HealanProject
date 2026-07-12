using Healan.Domain.Portal.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Portal.Configs;

public class RagKnowledgeItemConfiguration : IEntityTypeConfiguration<RagKnowledgeItem>
{
    public void Configure(EntityTypeBuilder<RagKnowledgeItem> builder)
    {
        builder.ToTable("RagKnowledgeItems");
        builder.HasKey(x => x.RagKnowledgeItemId);
        builder.Property(x => x.RagKnowledgeItemId).HasColumnType("bigint").ValueGeneratedOnAdd();
        builder.Property(x => x.Question).HasMaxLength(500).IsRequired();
        builder.Property(x => x.QuestionSummary).HasMaxLength(300);
        builder.Property(x => x.Keywords).HasMaxLength(500);
        builder.Property(x => x.Topic).HasMaxLength(120);
        builder.Property(x => x.Answer).HasColumnType("nvarchar(max)").IsRequired();
        builder.Property(x => x.SimilarQuestions).HasColumnType("nvarchar(max)");
        builder.Property(x => x.SearchText).HasColumnType("nvarchar(max)").IsRequired();
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.HasIndex(x => x.IsActive);
        builder.HasIndex(x => new { x.Topic, x.SortOrder });
    }
}
