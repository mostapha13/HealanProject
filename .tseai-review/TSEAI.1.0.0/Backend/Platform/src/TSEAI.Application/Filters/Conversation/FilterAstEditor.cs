using TSEAI.Application.Filters.Ast;

namespace TSEAI.Application.Filters.Conversation;

public static class FilterAstEditor
{
    public static IReadOnlyList<FilterExpression> FlattenAnd(FilterExpression expression)
    {
        var output = new List<FilterExpression>();
        Visit(expression, output);
        return output;
    }

    public static FilterExpression CombineAnd(IEnumerable<FilterExpression> expressions)
    {
        var items = expressions.ToList();
        if (items.Count == 0) throw new InvalidOperationException("Filter has no conditions.");
        var root = items[0];
        for (var i = 1; i < items.Count; i++) root = new BinaryExpression("&&", root, items[i]);
        return root;
    }

    public static FilterExpression Add(FilterExpression current, FilterExpression addition) =>
        CombineAnd(FlattenAnd(current).Concat(FlattenAnd(addition)));

    public static FilterExpression? RemoveAt(FilterExpression current, int zeroBasedIndex)
    {
        var items = FlattenAnd(current).ToList();
        if (zeroBasedIndex < 0 || zeroBasedIndex >= items.Count)
            throw new ArgumentOutOfRangeException(nameof(zeroBasedIndex), "Condition index is out of range.");
        items.RemoveAt(zeroBasedIndex);
        return items.Count == 0 ? null : CombineAnd(items);
    }

    public static FilterExpression ReplaceAt(FilterExpression current, int zeroBasedIndex, FilterExpression replacement)
    {
        var items = FlattenAnd(current).ToList();
        if (zeroBasedIndex < 0 || zeroBasedIndex >= items.Count)
            throw new ArgumentOutOfRangeException(nameof(zeroBasedIndex), "Condition index is out of range.");
        var replacementItems = FlattenAnd(replacement);
        items.RemoveAt(zeroBasedIndex);
        items.InsertRange(zeroBasedIndex, replacementItems);
        return CombineAnd(items);
    }

    public static FilterExpression? RemoveFirstContainingField(FilterExpression current, string fieldCode)
    {
        var items = FlattenAnd(current).ToList();
        var index = items.FindIndex(x => ContainsField(x, fieldCode));
        return index < 0 ? current : RemoveAt(current, index);
    }

    public static bool ContainsField(FilterExpression expression, string fieldCode)
    {
        return expression switch
        {
            FieldExpression f => f.Code.Equals(fieldCode, StringComparison.OrdinalIgnoreCase),
            UnaryExpression u => ContainsField(u.Operand, fieldCode),
            BinaryExpression b => ContainsField(b.Left, fieldCode) || ContainsField(b.Right, fieldCode),
            MemberExpression m => ContainsField(m.Target, fieldCode),
            CallExpression c => ContainsField(c.Callee, fieldCode) || c.Arguments.Any(x => ContainsField(x, fieldCode)),
            IndexExpression i => ContainsField(i.Target, fieldCode) || ContainsField(i.Index, fieldCode),
            _ => false
        };
    }

    private static void Visit(FilterExpression expression, List<FilterExpression> output)
    {
        if (expression is BinaryExpression { Operator: "&&" } and)
        {
            Visit(and.Left, output);
            Visit(and.Right, output);
            return;
        }
        output.Add(expression);
    }
}
