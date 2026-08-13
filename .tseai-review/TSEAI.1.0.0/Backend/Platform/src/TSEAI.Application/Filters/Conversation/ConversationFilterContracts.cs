namespace TSEAI.Application.Filters.Conversation;

public static class ConversationFilterOperations
{
    public const string Create = "create";
    public const string Add = "add";
    public const string ReplaceAll = "replace_all";
    public const string ReplaceCondition = "replace_condition";
    public const string RemoveLast = "remove_last";
    public const string RemoveCondition = "remove_condition";
    public const string RemoveField = "remove_field";
    public const string Clear = "clear";
    public const string Undo = "undo";
    public const string Redo = "redo";
    public const string Show = "show";
    public const string Explain = "explain";
    public const string Execute = "execute";
}

public sealed record AiConversationFilterPlan(
    string Status,
    string Operation,
    string? TsetmcCode,
    int? ConditionIndex,
    string? FieldCode,
    string Explanation,
    double Confidence,
    IReadOnlyList<string> MatchedRules);

public interface IAiConversationFilterPlanner
{
    Task<AiConversationFilterPlan> InterpretAsync(
        string question,
        string? currentCode,
        IReadOnlyList<string> currentConditions,
        CancellationToken ct);
}

public sealed record ConversationFilterRevision(
    int Version,
    string? Code,
    string Operation,
    string UserText,
    DateTimeOffset CreatedAtUtc);

public sealed record ConversationFilterState(
    string ConversationId,
    IReadOnlyList<ConversationFilterRevision> Revisions,
    int Cursor)
{
    public string? CurrentCode => Cursor >= 0 && Cursor < Revisions.Count ? Revisions[Cursor].Code : null;
    public int CurrentVersion => Cursor >= 0 && Cursor < Revisions.Count ? Revisions[Cursor].Version : 0;
    public bool CanUndo => Cursor >= 0;
    public bool CanRedo => Cursor + 1 < Revisions.Count;

    public static ConversationFilterState Empty(string conversationId) => new(conversationId, [], -1);
}

public interface IConversationFilterStateStore
{
    Task<ConversationFilterState> GetAsync(string subject, string conversationId, CancellationToken ct);
    Task SaveAsync(string subject, ConversationFilterState state, CancellationToken ct);
}

public interface IConversationFilterLock
{
    Task<IAsyncDisposable?> TryAcquireAsync(string subject, string conversationId, CancellationToken ct);
}

public sealed record ConversationFilterCondition(int Index, string Code, string Explanation);

public sealed record ConversationFilterResult(
    bool Success,
    string ConversationId,
    string Operation,
    string? Code,
    string? Explanation,
    double Confidence,
    int Version,
    bool CanUndo,
    bool CanRedo,
    IReadOnlyList<ConversationFilterCondition> Conditions,
    int? Scanned,
    int? Matched,
    int? Page,
    int? PageSize,
    int? TotalPages,
    string? SortBy,
    bool? SortDescending,
    object? Results,
    string? Error);
