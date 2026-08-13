namespace TSEAI.Domain.Filters;

public sealed class SavedFilter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string OwnerUserId { get; set; }
    public required string Name { get; set; }
    public required string NormalizedName { get; set; }
    public string? Description { get; set; }
    public bool IsFavorite { get; set; }
    public required string CurrentTsetmcCode { get; set; }
    public required string CurrentPersianExplanation { get; set; }
    public required string DependenciesJson { get; set; }
    public int CurrentVersion { get; set; } = 1;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public List<SavedFilterVersion> Versions { get; set; } = [];
}

public sealed class SavedFilterVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SavedFilterId { get; set; }
    public SavedFilter? SavedFilter { get; set; }
    public int Version { get; set; }
    public required string TsetmcCode { get; set; }
    public required string PersianExplanation { get; set; }
    public required string DependenciesJson { get; set; }
    public string? SourceConversationId { get; set; }
    public required string ChangeType { get; set; }
    public string? ChangeNote { get; set; }
    public required string CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
