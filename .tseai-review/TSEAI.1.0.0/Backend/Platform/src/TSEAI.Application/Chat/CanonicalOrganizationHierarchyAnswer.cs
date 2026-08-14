using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public static class CanonicalOrganizationHierarchyAnswer
{
    private static readonly string[] HierarchyCues =
    [
        "زیر مجموعه", "زیرمجموعه", "تابع", "مدیران زیر", "واحدهای زیر", "گزارش می دهند", "گزارش میدهند"
    ];

    private static readonly string[] ParentRelationCues =
    [
        "زیر مجموعه", "زیرمجموعه", "تابع", "وابسته", "بالادست", "گزارش می دهد", "گزارش میدهد",
        "گزارش می ده", "گزارش میده", "تحت مدیریت", "مدیر مستقیم", "مسئول مستقیم", "معاونتش"
    ];

    private static readonly string[] ParentTargetCues =
    [
        "چه معاونتی", "کدام معاونت", "کدوم معاونت", "چه معاونی", "کدام معاون", "کدوم معاون",
        "چه مدیریتی", "کدام مدیریت", "کدوم مدیریت", "چه واحدی", "کدام واحد", "کدوم واحد",
        "چه بخشی", "کدام بخش", "کدوم بخش", "کجاست", "کجا است", "بالادست",
        "به چه کسی", "به چه فردی", "به کی", "مدیر مستقیم", "مسئول مستقیم", "معاونتش"
    ];

    public static bool IsSubordinateQuestion(string? question)
    {
        var normalized=Normalize(question);
        if(!HierarchyCues.Any(cue=>normalized.Contains(cue,StringComparison.Ordinal))) return false;
        return normalized.Contains("کیا",StringComparison.Ordinal)
            || normalized.Contains("چه کسانی",StringComparison.Ordinal)
            || normalized.Contains("چه افرادی",StringComparison.Ordinal)
            || normalized.Contains("اعضا",StringComparison.Ordinal)
            || normalized.Contains("مدیران",StringComparison.Ordinal)
            || normalized.Contains("واحد",StringComparison.Ordinal)
            || normalized.Contains("معرفی",StringComparison.Ordinal)
            || normalized.Contains("بگو",StringComparison.Ordinal);
    }

    public static bool IsParentQuestion(string? question)
    {
        var normalized=Normalize(question);
        return ParentRelationCues.Any(cue=>normalized.Contains(cue,StringComparison.Ordinal))
            && ParentTargetCues.Any(cue=>normalized.Contains(cue,StringComparison.Ordinal));
    }

    public static string ComposeParent(
        string question,
        CanonicalPersonRoleCandidate child,
        CanonicalPersonRoleCandidate parent)
    {
        var normalizedQuestion=Normalize(question);
        var childName=PersianDisplayText.Normalize(child.FullName);
        var childRole=PersianDisplayText.Normalize(child.Role);
        var parentName=PersianDisplayText.Normalize(parent.FullName);
        var parentRole=PersianDisplayText.Normalize(parent.Role);

        if(normalizedQuestion.Contains("به چه کسی",StringComparison.Ordinal)
            || normalizedQuestion.Contains("به چه فردی",StringComparison.Ordinal)
            || normalizedQuestion.Contains("به کی",StringComparison.Ordinal)
            || normalizedQuestion.Contains("مدیر مستقیم",StringComparison.Ordinal)
            || normalizedQuestion.Contains("مسئول مستقیم",StringComparison.Ordinal))
            return $"{childName}، {childRole}، به {parentName}، {parentRole}، گزارش می‌دهد.";

        var parentUnit=parentRole.StartsWith("معاون ",StringComparison.Ordinal)
            ? "معاونت "+parentRole[6..]
            : parentRole;
        return $"{childName}، {childRole}، زیرمجموعه {parentUnit} است؛ {parentRole} {parentName} است.";
    }

    public static string? Compose(string masterRole,IEnumerable<CanonicalBoardMember> members)
    {
        var rows=members
            .Where(x=>ContainsPersian(x.FullName))
            .Select(x=>x with { FullName=PersianDisplayText.Normalize(x.FullName),Role=PersianDisplayText.Normalize(x.Role) })
            .Where(x=>x.FullName.Length>0 && x.Role.Length>0 && x.FullName!=x.Role)
            .GroupBy(x=>x.Role,StringComparer.Ordinal)
            .Select(group=>group.OrderByDescending(x=>x.EffectiveAt).ThenByDescending(x=>x.ContentId).First())
            .OrderBy(x=>x.Position).ThenBy(x=>x.Role,StringComparer.Ordinal)
            .ToArray();
        if(rows.Length==0) return null;
        var role=PersianDisplayText.Normalize(masterRole);
        return $"مدیران ثبت‌شده زیرمجموعه {role} بورس تهران:\n\n"+
            string.Join("\n",rows.Select((row,index)=>$"{index+1}. {row.FullName} — {row.Role}"));
    }

    public static bool ContainsPersian(string? value)
        => !string.IsNullOrWhiteSpace(value) && value.Any(ch=>ch is >= '\u0600' and <= '\u06ff');

    private static string Normalize(string? value)
        => Regex.Replace((value??"").Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('\u200c',' '),@"\s+"," ").Trim();
}
