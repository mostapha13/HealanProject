namespace Healan.Application.Portal.Messages;

/// <summary>پیام صف RabbitMQ برای ذخیره async لاگ گفتگوی RAG.</summary>
public class RagChatLogMessage
{
    public string Question { get; set; } = string.Empty;
    public string? Answer { get; set; }
    public long? MatchedKnowledgeItemId { get; set; }
    public double? SimilarityScore { get; set; }
    public string? SourceType { get; set; }
    public string? SessionId { get; set; }
    public string? GuestKey { get; set; }
    public Guid? IdentityUserId { get; set; }
    public string? PhoneNumber { get; set; }
    public bool WasAnswered { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
