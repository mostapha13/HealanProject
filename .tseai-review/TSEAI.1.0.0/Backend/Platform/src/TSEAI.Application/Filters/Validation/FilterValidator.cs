using TSEAI.Application.Filters.Ast;
using TSEAI.Application.Filters.Execution;
namespace TSEAI.Application.Filters.Validation;
public sealed record FilterValidationResult(bool IsValid,IReadOnlyList<string> Errors);
public sealed class FilterValidator
{
    private static readonly HashSet<string>CtMembers=new(StringComparer.OrdinalIgnoreCase){"Buy_CountI","Buy_CountN","Buy_I_Volume","Buy_N_Volume","Sell_CountI","Sell_CountN","Sell_I_Volume","Sell_N_Volume"};
    private static readonly HashSet<string>MathMembers=new(StringComparer.OrdinalIgnoreCase){"abs","ceil","exp","floor","log","max","min","pow","round","sqrt"};
    public FilterValidationResult Validate(FilterExpression expression){var errors=new List<string>();Visit(expression,errors);return new(errors.Count==0,errors.Distinct().ToArray());}
    private void Visit(FilterExpression e,List<string> errors)
    {
        switch(e)
        {
            case FieldExpression f:if(!TsetmcFieldRegistry.TryGet(f.Code,out _))errors.Add($"Unsupported TSETMC field: ({f.Code})");break;
            case IdentifierExpression i:if(!i.Name.Equals("Math",StringComparison.OrdinalIgnoreCase))errors.Add($"Unsupported identifier: {i.Name}");break;
            case UnaryExpression u:Visit(u.Operand,errors);break;
            case BinaryExpression b:Visit(b.Left,errors);Visit(b.Right,errors);break;
            case MemberExpression m:
                Visit(m.Target,errors);
                if(m.Target is FieldExpression {Code:"ct"}&&!CtMembers.Contains(m.Member))errors.Add($"Unsupported (ct) member: {m.Member}");
                else if(m.Target is IdentifierExpression {Name:"Math"}&&!MathMembers.Contains(m.Member))errors.Add($"Unsupported Math function: {m.Member}");
                else if(m.Target is not FieldExpression {Code:"ct"}&&m.Target is not IdentifierExpression {Name:"Math"}&&m.Member is not("length" or "indexOf"))errors.Add($"Unsupported member: {m.Member}");
                break;
            case CallExpression c:Visit(c.Callee,errors);foreach(var a in c.Arguments)Visit(a,errors);break;
            case IndexExpression i:Visit(i.Target,errors);Visit(i.Index,errors);break;
        }
    }
}
