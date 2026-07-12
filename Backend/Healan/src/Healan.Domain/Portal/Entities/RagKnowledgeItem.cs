using Share.Domain.Entities;

namespace Healan.Domain.Portal.Entities;

public class RagKnowledgeItem : AuditableEntity
{
    public long RagKnowledgeItemId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? QuestionSummary { get; set; }
    public string? Keywords { get; set; }
    public string? Topic { get; set; }
    public string Answer { get; set; } = string.Empty;
    public string? SimilarQuestions { get; set; }
    public string SearchText { get; set; } = string.Empty;
    public int Priority { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
