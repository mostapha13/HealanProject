using System.Text.RegularExpressions;
using TSEAI.Application.Alerts;
using TSEAI.Application.Filters.Conversation;
using TSEAI.Application.Filters.Saved;

namespace TSEAI.Application.Filters.ChatAssets;

public enum ChatFilterAssetOperation
{
    None, SaveCurrent, ListSaved, LoadSaved, DeleteSaved,
    CreateAlert, ListAlerts, EnableAlert, DisableAlert, DeleteAlert
}

public sealed record ChatFilterAssetCommand(
    ChatFilterAssetOperation Operation,
    string? Name = null,
    string? AlertName = null,
    double Confidence = 1);

public sealed record ChatFilterAssetAuthorization(bool CanSaveFilter, bool CanCreateAlert);

public sealed record ChatFilterAssetResult(
    bool Handled,
    bool Success,
    string Type,
    string Message,
    object? Data = null,
    string? ErrorCode = null);

public interface IChatFilterAssetCommandDetector
{
    ChatFilterAssetCommand Detect(string text);
}

public sealed class DeterministicChatFilterAssetCommandDetector : IChatFilterAssetCommandDetector
{
    private static readonly Regex Save = new(@"(?:این\s+فیلتر|این|همین|فیلتر(?:\s+فعلی)?)\s*(?:رو|را)?\s*(?:با\s+اسم|به\s+نام)\s*[«']?(?<name>[^»']+?)[»']?\s*(?:ذخیره|سیو)\s*(?:کن)?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex Load = new(@"(?:فیلتر\s*)?[«']?(?<name>.+?)[»']?\s*(?:رو|را)?\s*(?:بارگذاری|لود|فعال)\s*(?:کن)?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex DeleteFilter = new(@"(?:فیلتر\s*(?:ذخیره(?:\s*شده)?\s*)?)[«']?(?<name>.+?)[»']?\s*(?:رو|را)?\s*(?:حذف|پاک)\s*(?:کن)?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex AlertNamed = new(@"(?:برای\s+)?(?:فیلتر\s*)?[«']?(?<filter>.+?)[»']?\s*(?:یه|یک)?\s*هشدار(?:\s+با\s+اسم\s+[«']?(?<alert>[^»']+)[»']?)?\s*(?:بساز|ایجاد\s*کن|فعال\s*کن)$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex AlertToggle = new(@"هشدار\s*[«']?(?<name>.+?)[»']?\s*(?:رو|را)?\s*(?<op>فعال|غیرفعال|حذف|پاک)\s*(?:کن)?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public ChatFilterAssetCommand Detect(string text)
    {
        var t = Normalize(text);
        if (string.IsNullOrWhiteSpace(t)) return new(ChatFilterAssetOperation.None);

        if (Regex.IsMatch(t, @"^(?:فیلترهای\s+ذخیره(?:\s*شده)?(?:\s+من)?|لیست\s+فیلترهای\s+ذخیره(?:\s*شده)?)\s*(?:رو|را)?\s*(?:بده|نشون\s*بده|نمایش\s*بده)?$", RegexOptions.IgnoreCase))
            return new(ChatFilterAssetOperation.ListSaved);
        if (Regex.IsMatch(t, @"^(?:هشدارهای\s+من|لیست\s+هشدارها)\s*(?:رو|را)?\s*(?:بده|نشون\s*بده|نمایش\s*بده)?$", RegexOptions.IgnoreCase))
            return new(ChatFilterAssetOperation.ListAlerts);
        if (Regex.IsMatch(t, @"^(?:همین|این\s+فیلتر|فیلتر\s+فعلی)\s*(?:رو|را)?\s*(?:هشدار|alert)\s*(?:کن|بذار|بساز)$", RegexOptions.IgnoreCase))
            return new(ChatFilterAssetOperation.CreateAlert);

        var m = Save.Match(t);
        if (m.Success) return new(ChatFilterAssetOperation.SaveCurrent, CleanName(m.Groups["name"].Value));
        m = DeleteFilter.Match(t);
        if (m.Success) return new(ChatFilterAssetOperation.DeleteSaved, CleanName(m.Groups["name"].Value));
        m = AlertToggle.Match(t);
        if (m.Success)
        {
            var op = m.Groups["op"].Value;
            var operation = op.StartsWith("فعال", StringComparison.Ordinal) ? ChatFilterAssetOperation.EnableAlert
                : op.StartsWith("غیرفعال", StringComparison.Ordinal) ? ChatFilterAssetOperation.DisableAlert
                : ChatFilterAssetOperation.DeleteAlert;
            return new(operation, AlertName: CleanName(m.Groups["name"].Value));
        }
        m = AlertNamed.Match(t);
        if (m.Success) return new(ChatFilterAssetOperation.CreateAlert, CleanName(m.Groups["filter"].Value), CleanName(m.Groups["alert"].Value));
        m = Load.Match(t);
        if (m.Success && t.Contains("فیلتر", StringComparison.OrdinalIgnoreCase))
            return new(ChatFilterAssetOperation.LoadSaved, CleanName(m.Groups["name"].Value.Replace("فیلتر", "", StringComparison.OrdinalIgnoreCase)));

        return new(ChatFilterAssetOperation.None);
    }

    private static string Normalize(string value) => string.Join(' ', value.Replace('ي','ی').Replace('ك','ک').Replace('\u200c',' ').Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    private static string? CleanName(string value)
    {
        var n = Normalize(value).Trim('«','»','\"','\'',' ');
        return string.IsNullOrWhiteSpace(n) ? null : n;
    }
}

public sealed class ChatFilterAssetService(
    IChatFilterAssetCommandDetector detector,
    SavedFilterService savedFilters,
    AlertRuleService alerts,
    ConversationFilterService conversationFilters)
{
    public ChatFilterAssetCommand Detect(string text) => detector.Detect(text);

    public async Task<ChatFilterAssetResult> ExecuteAsync(
        string ownerUserId,
        string conversationId,
        ChatFilterAssetCommand command,
        ChatFilterAssetAuthorization authorization,
        CancellationToken ct)
    {
        if (command.Operation == ChatFilterAssetOperation.None) return new(false, false, "none", "");
        if ((command.Operation is ChatFilterAssetOperation.SaveCurrent or ChatFilterAssetOperation.ListSaved or ChatFilterAssetOperation.LoadSaved or ChatFilterAssetOperation.DeleteSaved)
            && !authorization.CanSaveFilter)
            return Denied("برای مدیریت فیلترهای ذخیره‌شده مجوز Filter.Save لازم است.");
        if ((command.Operation is ChatFilterAssetOperation.CreateAlert or ChatFilterAssetOperation.ListAlerts or ChatFilterAssetOperation.EnableAlert or ChatFilterAssetOperation.DisableAlert or ChatFilterAssetOperation.DeleteAlert)
            && !authorization.CanCreateAlert)
            return Denied("برای مدیریت هشدارها مجوز Alert.Create لازم است.");

        try
        {
            return command.Operation switch
            {
                ChatFilterAssetOperation.SaveCurrent => await SaveCurrentAsync(ownerUserId, conversationId, command.Name, ct),
                ChatFilterAssetOperation.ListSaved => await ListSavedAsync(ownerUserId, ct),
                ChatFilterAssetOperation.LoadSaved => await LoadSavedAsync(ownerUserId, conversationId, command.Name, ct),
                ChatFilterAssetOperation.DeleteSaved => await DeleteSavedAsync(ownerUserId, command.Name, ct),
                ChatFilterAssetOperation.CreateAlert => await CreateAlertAsync(ownerUserId, conversationId, command.Name, command.AlertName, authorization.CanSaveFilter, ct),
                ChatFilterAssetOperation.ListAlerts => await ListAlertsAsync(ownerUserId, ct),
                ChatFilterAssetOperation.EnableAlert => await ToggleAlertAsync(ownerUserId, command.AlertName, true, ct),
                ChatFilterAssetOperation.DisableAlert => await ToggleAlertAsync(ownerUserId, command.AlertName, false, ct),
                ChatFilterAssetOperation.DeleteAlert => await DeleteAlertAsync(ownerUserId, command.AlertName, ct),
                _ => new(false, false, "none", "")
            };
        }
        catch (SavedFilterLimitReachedException ex) { return Fail("saved_filter_limit_reached", ex.Message); }
        catch (AlertLimitReachedException ex) { return Fail("alert_limit_reached", ex.Message); }
        catch (KeyNotFoundException ex) { return Fail("not_found", ex.Message); }
        catch (InvalidOperationException ex) { return Fail("conflict", ex.Message); }
        catch (ArgumentException ex) { return Fail("invalid_request", ex.Message); }
    }

    private async Task<ChatFilterAssetResult> SaveCurrentAsync(string userId, string conversationId, string? name, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name)) return Fail("name_required", "نام فیلتر را مشخص کنید؛ مثلاً «همین رو با اسم کم P/E ذخیره کن».");
        var row = await savedFilters.CreateAsync(userId, new CreateSavedFilterRequest(name, "ذخیره‌شده از Chat", conversationId, null), ct);
        return Ok("saved_filter_saved", $"فیلتر «{row.Name}» با نسخه {row.CurrentVersion} ذخیره شد.", row);
    }

    private async Task<ChatFilterAssetResult> ListSavedAsync(string userId, CancellationToken ct)
    {
        var rows = await savedFilters.ListAsync(userId, null, null, ct);
        var message = rows.Count == 0 ? "فیلتر ذخیره‌شده‌ای ندارید." : "فیلترهای ذخیره‌شده:\n" + string.Join("\n", rows.Select((x,i) => $"{i+1}. {x.Name} (v{x.CurrentVersion})"));
        return Ok("saved_filter_list", message, rows);
    }

    private async Task<ChatFilterAssetResult> LoadSavedAsync(string userId, string conversationId, string? name, CancellationToken ct)
    {
        var row = await FindSavedAsync(userId, name, ct);
        var state = await savedFilters.LoadIntoConversationAsync(userId, row.Id, conversationId, ct);
        return Ok("saved_filter_loaded", $"فیلتر «{row.Name}» در این مکالمه بارگذاری شد. کد فعلی: {state.CurrentCode}", new { filter = row, state.CurrentVersion, state.CanUndo, state.CanRedo });
    }

    private async Task<ChatFilterAssetResult> DeleteSavedAsync(string userId, string? name, CancellationToken ct)
    {
        var row = await FindSavedAsync(userId, name, ct);
        await savedFilters.DeleteAsync(userId, row.Id, ct);
        return Ok("saved_filter_deleted", $"فیلتر «{row.Name}» حذف شد.");
    }

    private async Task<ChatFilterAssetResult> CreateAlertAsync(string userId, string conversationId, string? filterName, string? alertName, bool canSaveFilter, CancellationToken ct)
    {
        SavedFilterListItem filter;
        if (!string.IsNullOrWhiteSpace(filterName) && !IsCurrentReference(filterName))
        {
            filter = await FindSavedAsync(userId, filterName, ct);
        }
        else
        {
            var current = await conversationFilters.GetAsync(userId, conversationId, ct);
            if (string.IsNullOrWhiteSpace(current.Code)) return Fail("no_active_filter", "در این مکالمه فیلتر فعالی وجود ندارد.");
            var existing = (await savedFilters.ListAsync(userId, null, null, ct)).FirstOrDefault(x => string.Equals(x.TsetmcCode, current.Code, StringComparison.Ordinal));
            if (existing is not null) filter = existing;
            else
            {
                if (!canSaveFilter) return Denied("برای ساخت هشدار از فیلتر ذخیره‌نشده، مجوز Filter.Save نیز لازم است.");
                var generated = $"فیلتر مکالمه {DateTime.UtcNow:yyyyMMdd-HHmmss}";
                var created = await savedFilters.CreateAsync(userId, new CreateSavedFilterRequest(generated, "ایجاد خودکار برای Alert از Chat", conversationId, null), ct);
                filter = new(created.Id, created.Name, created.Description, created.IsFavorite, created.TsetmcCode, created.PersianExplanation, created.CurrentVersion, created.UpdatedAtUtc);
            }
        }
        var rule = await alerts.CreateAsync(userId, new CreateAlertRuleRequest(filter.Id, alertName ?? $"هشدار {filter.Name}", null, true, null, true), ct);
        return Ok("alert_created", $"هشدار «{rule.Name}» برای فیلتر «{filter.Name}» فعال شد.", rule);
    }

    private async Task<ChatFilterAssetResult> ListAlertsAsync(string userId, CancellationToken ct)
    {
        var rows = await alerts.ListAsync(userId, ct);
        var message = rows.Count == 0 ? "هشداری ندارید." : "هشدارهای شما:\n" + string.Join("\n", rows.Select((x,i) => $"{i+1}. {x.Name} — {(x.IsEnabled ? "فعال" : "غیرفعال")} — {x.SavedFilterName}"));
        return Ok("alert_list", message, rows);
    }

    private async Task<ChatFilterAssetResult> ToggleAlertAsync(string userId, string? name, bool enabled, CancellationToken ct)
    {
        var row = await FindAlertAsync(userId, name, ct);
        var updated = await alerts.UpdateAsync(userId, row.Id, new UpdateAlertRuleRequest(null, enabled, null, null, null), ct);
        return Ok(enabled ? "alert_enabled" : "alert_disabled", $"هشدار «{updated.Name}» {(enabled ? "فعال" : "غیرفعال")} شد.", updated);
    }

    private async Task<ChatFilterAssetResult> DeleteAlertAsync(string userId, string? name, CancellationToken ct)
    {
        var row = await FindAlertAsync(userId, name, ct);
        await alerts.DeleteAsync(userId, row.Id, ct);
        return Ok("alert_deleted", $"هشدار «{row.Name}» حذف شد.");
    }

    private async Task<SavedFilterListItem> FindSavedAsync(string userId, string? name, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("نام فیلتر مشخص نشده است.");
        var rows = await savedFilters.ListAsync(userId, name, null, ct);
        var exact = rows.Where(x => EqualName(x.Name, name)).ToArray();
        if (exact.Length == 1) return exact[0];
        if (exact.Length > 1) throw new InvalidOperationException("چند فیلتر با نام مشابه پیدا شد؛ نام دقیق‌تری وارد کنید.");
        throw new KeyNotFoundException($"فیلتر «{name}» پیدا نشد.");
    }

    private async Task<AlertRuleListItem> FindAlertAsync(string userId, string? name, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("نام هشدار مشخص نشده است.");
        var exact = (await alerts.ListAsync(userId, ct)).Where(x => EqualName(x.Name, name)).ToArray();
        if (exact.Length == 1) return exact[0];
        if (exact.Length > 1) throw new InvalidOperationException("چند هشدار با نام مشابه پیدا شد؛ نام دقیق‌تری وارد کنید.");
        throw new KeyNotFoundException($"هشدار «{name}» پیدا نشد.");
    }

    private static bool EqualName(string a, string b) => string.Equals(NormalizeName(a), NormalizeName(b), StringComparison.OrdinalIgnoreCase);
    private static string NormalizeName(string value) => string.Join(' ', value.Replace('ي','ی').Replace('ك','ک').Replace('\u200c',' ').Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    private static bool IsCurrentReference(string value) => value.Contains("همین") || value.Contains("این فیلتر") || value.Contains("فیلتر فعلی");
    private static ChatFilterAssetResult Ok(string type, string message, object? data = null) => new(true, true, type, message, data);
    private static ChatFilterAssetResult Fail(string code, string message) => new(true, false, "filter_asset_error", message, null, code);
    private static ChatFilterAssetResult Denied(string message) => new(true, false, "forbidden", message, null, "forbidden");
}
