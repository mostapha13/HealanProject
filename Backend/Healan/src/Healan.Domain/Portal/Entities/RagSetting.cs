namespace Healan.Domain.Portal.Entities;

public class RagSetting
{
    public int RagSettingId { get; set; } = 1;
    public int SyncIntervalMinutes { get; set; } = 10;
    public int SimilarityThresholdPercent { get; set; } = 55;
    public string PythonApiUrl { get; set; } = "http://python-rag:8000";
    public bool IsEnabled { get; set; } = true;
    /// <summary>سقف سوال روزانه برای مهمان (بدون لاگین).</summary>
    public int GuestDailyLimit { get; set; } = 10;
    /// <summary>سقف سوال روزانه برای کاربر لاگین‌شده (SiteUser).</summary>
    public int AuthenticatedDailyLimit { get; set; } = 200;
    /// <summary>مدل embedding سرویس Python (مثلاً heydariAI/persian-embeddings).</summary>
    public string EmbeddingModel { get; set; } = "heydariAI/persian-embeddings";
    /// <summary>مدل خلاصه‌ساز بلاگ/نظرات (مثلاً qwen2.5:3b روی Ollama).</summary>
    public string SummarizeModel { get; set; } = "qwen2.5:3b";
    /// <summary>مدل گفتار به متن Whisper (مثلاً small / base / tiny).</summary>
    public string SttModel { get; set; } = "small";
    /// <summary>اگر true باشد، سوال/جواب دستیار در «گفتگوهای دستیار» ذخیره می‌شود.</summary>
    public bool SaveChatLogs { get; set; } = true;
    public DateTime? LastSyncedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
