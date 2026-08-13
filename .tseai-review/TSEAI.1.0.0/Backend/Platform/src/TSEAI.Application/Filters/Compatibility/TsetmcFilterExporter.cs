using System.Globalization;
using TSEAI.Application.Filters.Ast;

namespace TSEAI.Application.Filters.Compatibility;

public sealed class TsetmcFilterExporter
{
    public string Export(FilterExpression expression) => Write(expression, 0);

    private string Write(FilterExpression expression, int parentPrecedence)
    {
        var precedence = Precedence(expression);
        var text = expression switch
        {
            LiteralExpression literal => Literal(literal.Value),
            FieldExpression field => $"({field.Code})",
            IdentifierExpression identifier => identifier.Name,
            UnaryExpression unary => unary.Operator + Write(unary.Operand, precedence),
            BinaryExpression binary => $"{Write(binary.Left, precedence)} {binary.Operator} {Write(binary.Right, precedence + 1)}",
            MemberExpression member => $"{Write(member.Target, precedence)}.{member.Member}",
            CallExpression call => $"{Write(call.Callee, precedence)}({string.Join(", ", call.Arguments.Select(x => Write(x, 0)))})",
            IndexExpression index => $"{Write(index.Target, precedence)}[{Write(index.Index, 0)}]",
            _ => throw new NotSupportedException(expression.GetType().Name)
        };
        return precedence < parentPrecedence ? $"({text})" : text;
    }

    private static int Precedence(FilterExpression expression) => expression switch
    {
        BinaryExpression { Operator: "||" } => 1,
        BinaryExpression { Operator: "&&" } => 2,
        BinaryExpression { Operator: "==" or "!=" } => 3,
        BinaryExpression { Operator: ">" or ">=" or "<" or "<=" } => 4,
        BinaryExpression { Operator: "+" or "-" } => 5,
        BinaryExpression { Operator: "*" or "/" or "%" } => 6,
        UnaryExpression => 7,
        MemberExpression or CallExpression or IndexExpression => 8,
        _ => 9
    };

    private static string Literal(object? value) => value switch
    {
        null => "null",
        bool boolean => boolean ? "true" : "false",
        string text => "\"" + text.Replace("\\", "\\\\", StringComparison.Ordinal).Replace("\"", "\\\"", StringComparison.Ordinal) + "\"",
        decimal number => number.ToString("0.############################", CultureInfo.InvariantCulture),
        IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture) ?? "0",
        _ => value.ToString() ?? "null"
    };
}
