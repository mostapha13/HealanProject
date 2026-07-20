using Healan.Domain.Portal.Enums;

namespace Healan.Application.Portal.Dtos;

public class PortalContentItemDto
{
    public long PortalContentItemId { get; set; }
    public PortalSectionType SectionType { get; set; }
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Body { get; set; }
    public string? ImageUrl { get; set; }
    public Guid? ImageFileId { get; set; }
    public string? IconName { get; set; }
    public string? LinkUrl { get; set; }
    public string? Color { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
}

public class PortalSiteSettingDto
{
    public long PortalSiteSettingId { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string? SettingGroup { get; set; }
    public string? Description { get; set; }
}

public class PatientReviewDto
{
    public long PatientReviewId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string ContactInfo { get; set; } = string.Empty;
    public string ReviewText { get; set; } = string.Empty;
    public int Rating { get; set; }
    public PatientReviewStatus Status { get; set; }
    public int SortOrder { get; set; }
    public string? AdminNote { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PublishedPortalSiteDto
{
    public Dictionary<string, string> Settings { get; set; } = new();
    public List<PortalContentItemDto> ContentItems { get; set; } = new();
    public List<PatientReviewDto> Reviews { get; set; } = new();
}

public class PortalMutationResult
{
    public long Id { get; set; }
}

public class BlogPostSummaryDto
{
    public long BlogPostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? CoverImageUrl { get; set; }
    public Guid? CoverImageFileId { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BlogPostDetailDto : BlogPostSummaryDto
{
    public string Body { get; set; } = string.Empty;
}

public class RagKnowledgeItemDto
{
    public long RagKnowledgeItemId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? QuestionSummary { get; set; }
    public string? Keywords { get; set; }
    public string? Topic { get; set; }
    public string Answer { get; set; } = string.Empty;
    public string? SimilarQuestions { get; set; }
    public int Priority { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastModifiedAt { get; set; }
}

public class RagSettingDto
{
    public int RagSettingId { get; set; }
    public int SyncIntervalMinutes { get; set; }
    public int SimilarityThresholdPercent { get; set; }
    public string PythonApiUrl { get; set; } = "http://python-rag:8000";
    public bool IsEnabled { get; set; }
    public int GuestDailyLimit { get; set; } = 10;
    public int AuthenticatedDailyLimit { get; set; } = 200;
    public string EmbeddingModel { get; set; } = "heydariAI/persian-embeddings";
    public string SummarizeModel { get; set; } = "qwen2.5:3b";
    public string SttModel { get; set; } = "small";
    public DateTime? LastSyncedAt { get; set; }
}

public class RagAskRequestDto
{
    public string Question { get; set; } = string.Empty;
    public string? SessionId { get; set; }
    public string? GuestKey { get; set; }
}

public class RagAskResponseDto
{
    public string Answer { get; set; } = string.Empty;
    public bool WasAnswered { get; set; }
    public double? SimilarityScore { get; set; }
    public long? MatchedKnowledgeItemId { get; set; }
    public string? SourceType { get; set; }
    public bool RequiresLogin { get; set; }
    public int UsedCount { get; set; }
    public int DailyLimit { get; set; }
    public int RemainingCount { get; set; }
    public bool IsAuthenticated { get; set; }
}

public class RagQuotaStatusDto
{
    public bool IsAuthenticated { get; set; }
    public int UsedCount { get; set; }
    public int DailyLimit { get; set; }
    public int RemainingCount { get; set; }
    public bool RequiresLogin { get; set; }
    public string? PhoneMasked { get; set; }
}

public class RagChatLogDto
{
    public long RagChatLogId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Answer { get; set; }
    public double? SimilarityScore { get; set; }
    public string? SourceType { get; set; }
    public string? SessionId { get; set; }
    public string? GuestKey { get; set; }
    public Guid? IdentityUserId { get; set; }
    public string? PhoneNumber { get; set; }
    public bool WasAnswered { get; set; }
    public bool IsAuthenticated { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PortalOtpRequestDto
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class PortalOtpVerifyDto
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class PortalAuthResultDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PhoneMasked { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
}
