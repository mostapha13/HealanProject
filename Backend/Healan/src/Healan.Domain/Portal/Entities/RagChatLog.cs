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
    /// <summary>کلید پایدار مهمان (cookie) برای سهمیه روزانه.</summary>
    public string? GuestKey { get; set; }
    /// <summary>کاربر Identity پس از لاگین پورتال.</summary>
    public Guid? IdentityUserId { get; set; }
    /// <summary>شماره موبایل کاربر لاگین‌شده (برای نمایش در کلینیک).</summary>
    public string? PhoneNumber { get; set; }
    public bool WasAnswered { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
