using TSEAI.Application.Filters.Ast;
using TSEAI.Application.Filters.Compatibility;
using TSEAI.Application.Filters.Execution;

namespace TSEAI.Application.Filters.Conversation;

public sealed class ConversationFilterService(
    IAiConversationFilterPlanner planner,
    IConversationFilterStateStore stateStore,
    IConversationFilterLock conversationLock,
    TsetmcCompatibilityService compatibility,
    FilterExecutionService execution)
{
    private readonly TsetmcFilterExporter _exporter = new();

    public async Task<ConversationFilterResult> ProcessAsync(
        string subject,
        string conversationId,
        string question,
        FilterExecutionOptions executionOptions,
        CancellationToken ct,
        string? fallbackSubject = null)
    {
        if (string.IsNullOrWhiteSpace(conversationId)) throw new ArgumentException("Conversation id is required.", nameof(conversationId));
        await using var lease = await conversationLock.TryAcquireAsync(subject, conversationId, ct);
        if (lease is null)
        {
            var busyState = await stateStore.GetAsync(subject, conversationId, ct);
            return Failure(busyState, "busy", 1, "درخواست قبلی این مکالمه هنوز در حال پردازش است. دوباره ارسال نکنید.");
        }
        var state = await LoadWithFallbackAsync(subject, fallbackSubject, conversationId, ct);
        var before = DescribeConditions(state.CurrentCode);
        var plan = await planner.InterpretAsync(question, state.CurrentCode, before.Select(x => x.Code).ToArray(), ct);
        if (!plan.Status.Equals("ok", StringComparison.OrdinalIgnoreCase))
            return Failure(state, plan.Operation, plan.Confidence, plan.Explanation);

        try
        {
            state = await ApplyAsync(subject, state, plan, question, ct);
            var code = state.CurrentCode;
            if (string.IsNullOrWhiteSpace(code))
            {
                return new(true, conversationId, plan.Operation, null, "در حال حاضر هیچ فیلتر فعالی وجود ندارد.", plan.Confidence,
                    state.CurrentVersion, state.CanUndo, state.CanRedo, [], null, null, null, null, null, null, null, null, null);
            }

            var imported = compatibility.Import(code);
            if (!imported.Valid)
                return Failure(state, plan.Operation, plan.Confidence, "فیلتر نهایی توسط Validator رد شد: " + string.Join("; ", imported.Errors));

            var result = await execution.ExecuteAsync(imported.CanonicalTsetmcCode, executionOptions, ct);
            return new(true, conversationId, plan.Operation, imported.CanonicalTsetmcCode, imported.PersianExplanation,
                plan.Confidence, state.CurrentVersion, state.CanUndo, state.CanRedo, DescribeConditions(imported.CanonicalTsetmcCode),
                result.Scanned, result.Matched, result.Page, result.PageSize, result.TotalPages, result.SortBy, result.SortDescending, result.Results, null);
        }
        catch (Exception ex) when (ex is InvalidOperationException or ArgumentOutOfRangeException or ArgumentException)
        {
            return Failure(state, plan.Operation, plan.Confidence, ex.Message);
        }
    }

    public async Task<ConversationFilterResult> ImportDslAsync(
        string subject,
        string conversationId,
        string source,
        FilterExecutionOptions executionOptions,
        CancellationToken ct,
        string? fallbackSubject = null)
    {
        if (string.IsNullOrWhiteSpace(conversationId)) throw new ArgumentException("Conversation id is required.", nameof(conversationId));
        var imported = compatibility.Import(source);
        if (!imported.Valid)
            return new(false, conversationId, ConversationFilterOperations.Create, null, null, 1, 0, false, false, [], null, null, null, null, null, null, null, null,
                "کد TSETMC توسط Validator رد شد: " + string.Join("; ", imported.Errors));

        await using var lease = await conversationLock.TryAcquireAsync(subject, conversationId, ct);
        if (lease is null)
        {
            var busyState = await stateStore.GetAsync(subject, conversationId, ct);
            return Failure(busyState, "busy", 1, "درخواست قبلی این مکالمه هنوز در حال پردازش است. دوباره ارسال نکنید.");
        }

        var state = await LoadWithFallbackAsync(subject, fallbackSubject, conversationId, ct);
        state = AppendRevision(state, imported.CanonicalTsetmcCode, ConversationFilterOperations.Create, source);
        await stateStore.SaveAsync(subject, state, ct);
        var result = await execution.ExecuteAsync(imported.CanonicalTsetmcCode, executionOptions, ct);
        return new(true, conversationId, ConversationFilterOperations.Create, imported.CanonicalTsetmcCode, imported.PersianExplanation, 1,
            state.CurrentVersion, state.CanUndo, state.CanRedo, DescribeConditions(imported.CanonicalTsetmcCode),
            result.Scanned, result.Matched, result.Page, result.PageSize, result.TotalPages, result.SortBy, result.SortDescending, result.Results, null);
    }

    public async Task<ConversationFilterResult> GetAsync(string subject, string conversationId, CancellationToken ct, string? fallbackSubject = null)
    {
        var state = await LoadWithFallbackAsync(subject, fallbackSubject, conversationId, ct);
        if (string.IsNullOrWhiteSpace(state.CurrentCode))
            return new(true, conversationId, ConversationFilterOperations.Show, null, "در حال حاضر هیچ فیلتر فعالی وجود ندارد.", 1,
                state.CurrentVersion, state.CanUndo, state.CanRedo, [], null, null, null, null, null, null, null, null, null);
        var imported = compatibility.Import(state.CurrentCode);
        return imported.Valid
            ? new(true, conversationId, ConversationFilterOperations.Show, imported.CanonicalTsetmcCode, imported.PersianExplanation, 1,
                state.CurrentVersion, state.CanUndo, state.CanRedo, DescribeConditions(imported.CanonicalTsetmcCode), null, null, null, null, null, null, null, null, null)
            : Failure(state, ConversationFilterOperations.Show, 1, string.Join("; ", imported.Errors));
    }

    private async Task<ConversationFilterState> LoadWithFallbackAsync(string subject, string? fallbackSubject, string conversationId, CancellationToken ct)
    {
        var state = await stateStore.GetAsync(subject, conversationId, ct);
        if (state.Revisions.Count > 0 || string.IsNullOrWhiteSpace(fallbackSubject) || string.Equals(subject, fallbackSubject, StringComparison.Ordinal))
            return state;
        var fallback = await stateStore.GetAsync(fallbackSubject, conversationId, ct);
        if (fallback.Revisions.Count == 0) return state;
        await stateStore.SaveAsync(subject, fallback, ct);
        return fallback;
    }

    private async Task<ConversationFilterState> ApplyAsync(
        string subject,
        ConversationFilterState state,
        AiConversationFilterPlan plan,
        string userText,
        CancellationToken ct)
    {
        var operation = plan.Operation.ToLowerInvariant();
        switch (operation)
        {
            case ConversationFilterOperations.Undo:
                if (!state.CanUndo) throw new InvalidOperationException("نسخه قبلی برای بازگشت وجود ندارد.");
                state = state with { Cursor = state.Cursor - 1 };
                await stateStore.SaveAsync(subject, state, ct);
                return state;

            case ConversationFilterOperations.Redo:
                if (!state.CanRedo) throw new InvalidOperationException("نسخه بعدی برای اعمال مجدد وجود ندارد.");
                state = state with { Cursor = state.Cursor + 1 };
                await stateStore.SaveAsync(subject, state, ct);
                return state;

            case ConversationFilterOperations.Show:
            case ConversationFilterOperations.Explain:
            case ConversationFilterOperations.Execute:
                return state;

            case ConversationFilterOperations.Clear:
                state = AppendRevision(state, null, operation, userText);
                await stateStore.SaveAsync(subject, state, ct);
                return state;
        }

        var currentAst = ParseCurrent(state.CurrentCode);
        FilterExpression? nextAst = operation switch
        {
            ConversationFilterOperations.Create or ConversationFilterOperations.ReplaceAll => ParseRequired(plan.TsetmcCode),
            ConversationFilterOperations.Add => currentAst is null
                ? ParseRequired(plan.TsetmcCode)
                : FilterAstEditor.Add(currentAst, ParseRequired(plan.TsetmcCode)),
            ConversationFilterOperations.RemoveLast => currentAst is null
                ? throw new InvalidOperationException("فیلتر فعالی برای حذف شرط وجود ندارد.")
                : FilterAstEditor.RemoveAt(currentAst, FilterAstEditor.FlattenAnd(currentAst).Count - 1),
            ConversationFilterOperations.RemoveCondition => currentAst is null
                ? throw new InvalidOperationException("فیلتر فعالی برای حذف شرط وجود ندارد.")
                : FilterAstEditor.RemoveAt(currentAst, RequireIndex(plan.ConditionIndex) - 1),
            ConversationFilterOperations.RemoveField => currentAst is null
                ? throw new InvalidOperationException("فیلتر فعالی برای حذف شرط وجود ندارد.")
                : RemoveField(currentAst, plan.FieldCode),
            ConversationFilterOperations.ReplaceCondition => currentAst is null
                ? throw new InvalidOperationException("فیلتر فعالی برای تغییر شرط وجود ندارد.")
                : FilterAstEditor.ReplaceAt(currentAst, RequireIndex(plan.ConditionIndex) - 1, ParseRequired(plan.TsetmcCode)),
            _ => throw new InvalidOperationException($"عملیات مکالمه‌ای پشتیبانی نمی‌شود: {plan.Operation}")
        };

        var nextCode = nextAst is null ? null : ValidateAndExport(nextAst);
        state = AppendRevision(state, nextCode, operation, userText);
        await stateStore.SaveAsync(subject, state, ct);
        return state;
    }

    private FilterExpression? ParseCurrent(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var imported = compatibility.Import(code);
        if (!imported.Valid || imported.Ast is null) throw new InvalidOperationException("فیلتر فعلی معتبر نیست.");
        return imported.Ast;
    }

    private FilterExpression ParseRequired(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) throw new InvalidOperationException("برای این عملیات شرط جدید مشخص نشده است.");
        var imported = compatibility.Import(code);
        if (!imported.Valid || imported.Ast is null) throw new InvalidOperationException("شرط پیشنهادی معتبر نیست: " + string.Join("; ", imported.Errors));
        return imported.Ast;
    }

    private string ValidateAndExport(FilterExpression ast)
    {
        var code = _exporter.Export(ast);
        var imported = compatibility.Import(code);
        if (!imported.Valid) throw new InvalidOperationException("ویرایش فیلتر نامعتبر شد: " + string.Join("; ", imported.Errors));
        return imported.CanonicalTsetmcCode;
    }

    private static int RequireIndex(int? index) => index is > 0 ? index.Value : throw new InvalidOperationException("شماره شرط مشخص نشده است.");

    private static FilterExpression? RemoveField(FilterExpression current, string? fieldCode)
    {
        if (string.IsNullOrWhiteSpace(fieldCode)) throw new InvalidOperationException("فیلد شرط برای حذف مشخص نشده است.");
        var result = FilterAstEditor.RemoveFirstContainingField(current, fieldCode);
        if (ReferenceEquals(result, current)) throw new InvalidOperationException($"شرطی با فیلد ({fieldCode}) پیدا نشد.");
        return result;
    }

    private static ConversationFilterState AppendRevision(ConversationFilterState state, string? code, string operation, string userText)
    {
        var revisions = state.Revisions.Take(state.Cursor + 1).ToList();
        var version = revisions.Count == 0 ? 1 : revisions.Max(x => x.Version) + 1;
        revisions.Add(new(version, code, operation, userText, DateTimeOffset.UtcNow));
        const int maxTransientRevisions = 100;
        if (revisions.Count > maxTransientRevisions)
            revisions.RemoveRange(0, revisions.Count - maxTransientRevisions);
        return state with { Revisions = revisions, Cursor = revisions.Count - 1 };
    }

    private IReadOnlyList<ConversationFilterCondition> DescribeConditions(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return [];
        var imported = compatibility.Import(code);
        if (!imported.Valid || imported.Ast is null) return [];
        return FilterAstEditor.FlattenAnd(imported.Ast)
            .Select((ast, i) =>
            {
                var clauseCode = _exporter.Export(ast);
                var clause = compatibility.Import(clauseCode);
                return new ConversationFilterCondition(i + 1, clause.CanonicalTsetmcCode, clause.PersianExplanation);
            }).ToArray();
    }

    private static ConversationFilterResult Failure(ConversationFilterState state, string operation, double confidence, string error) =>
        new(false, state.ConversationId, operation, state.CurrentCode, null, confidence, state.CurrentVersion,
            state.CanUndo, state.CanRedo, [], null, null, null, null, null, null, null, null, error);
}
