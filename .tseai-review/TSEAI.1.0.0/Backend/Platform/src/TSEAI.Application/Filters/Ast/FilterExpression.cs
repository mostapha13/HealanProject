using System.Text.Json.Serialization;
namespace TSEAI.Application.Filters.Ast;
[JsonPolymorphic(TypeDiscriminatorPropertyName="$type")]
[JsonDerivedType(typeof(LiteralExpression),"literal")]
[JsonDerivedType(typeof(FieldExpression),"field")]
[JsonDerivedType(typeof(IdentifierExpression),"identifier")]
[JsonDerivedType(typeof(UnaryExpression),"unary")]
[JsonDerivedType(typeof(BinaryExpression),"binary")]
[JsonDerivedType(typeof(MemberExpression),"member")]
[JsonDerivedType(typeof(CallExpression),"call")]
[JsonDerivedType(typeof(IndexExpression),"index")]
public abstract record FilterExpression;
public sealed record LiteralExpression(object? Value) : FilterExpression;
public sealed record FieldExpression(string Code) : FilterExpression;
public sealed record IdentifierExpression(string Name) : FilterExpression;
public sealed record UnaryExpression(string Operator, FilterExpression Operand) : FilterExpression;
public sealed record BinaryExpression(string Operator, FilterExpression Left, FilterExpression Right) : FilterExpression;
public sealed record MemberExpression(FilterExpression Target, string Member) : FilterExpression;
public sealed record CallExpression(FilterExpression Callee, IReadOnlyList<FilterExpression> Arguments) : FilterExpression;
public sealed record IndexExpression(FilterExpression Target, FilterExpression Index) : FilterExpression;
