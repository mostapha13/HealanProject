namespace Healan.Domain.Portal.Entities;

public class RagSetting
{
    public int RagSettingId { get; set; } = 1;
    public int SyncIntervalMinutes { get; set; } = 10;
    public int SimilarityThresholdPercent { get; set; } = 55;
    public string PythonApiUrl { get; set; } = "http://localhost:8000";
    public bool IsEnabled { get; set; } = true;
    public DateTime? LastSyncedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
