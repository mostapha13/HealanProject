namespace TSEAI.Application.Filters.Ast;

public static class AstDebugPrinter
{
    public static string Print(FilterExpression expression, int depth = 0)
    {
        ArgumentNullException.ThrowIfNull(expression);

        var prefix = new string(' ', depth * 2);
        return expression switch
        {
            LiteralExpression literal => $"{prefix}Literal({literal.Value})",
            FieldExpression field => $"{prefix}Field(({field.Code}))",
            IdentifierExpression identifier => $"{prefix}Identifier({identifier.Name})",
            UnaryExpression unary =>
                $"{prefix}Unary {unary.Operator}{Environment.NewLine}{Print(unary.Operand, depth + 1)}",
            BinaryExpression binary =>
                $"{prefix}Binary {binary.Operator}{Environment.NewLine}{Print(binary.Left, depth + 1)}{Environment.NewLine}{Print(binary.Right, depth + 1)}",
            MemberExpression member =>
                $"{prefix}Member .{member.Member}{Environment.NewLine}{Print(member.Target, depth + 1)}",
            CallExpression call =>
                $"{prefix}Call{Environment.NewLine}{Print(call.Callee, depth + 1)}{Environment.NewLine}{string.Join(Environment.NewLine, call.Arguments.Select(argument => Print(argument, depth + 1)))}",
            IndexExpression index =>
                $"{prefix}Index{Environment.NewLine}{Print(index.Target, depth + 1)}{Environment.NewLine}{Print(index.Index, depth + 1)}",
            _ => prefix + expression.GetType().Name
        };
    }
}
