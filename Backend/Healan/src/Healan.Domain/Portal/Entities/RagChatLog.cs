namespace Healan.Domain.Portal.Entities;

public class RagChatLog
{
    public long RagChatLogId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Answer { get; set; }
    public long? MatchedKnowledgeItemId { get; set; }
    public double? SimilarityScore { get; set; }
    public string? SourceType { get; set; }
    public string? SessionId { get; set; }
    public bool WasAnswered { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
