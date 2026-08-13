using TSEAI.Application.Filters.Ast;
using TSEAI.Application.Filters.Compatibility;

namespace TSEAI.Alert.Worker;

public sealed record AlertRuleSnapshot(
    Guid AlertRuleId,
    string OwnerUserId,
    Guid SavedFilterId,
    int FilterVersion,
    string AlertName,
    string FilterName,
    int CooldownSeconds,
    string TsetmcCode,
    string PersianExplanation,
    FilterExpression Ast,
    FilterDependencies Dependencies);
