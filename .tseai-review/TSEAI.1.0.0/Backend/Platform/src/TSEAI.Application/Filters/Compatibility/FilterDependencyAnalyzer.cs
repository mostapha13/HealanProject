using TSEAI.Application.Filters.Ast;
namespace TSEAI.Application.Filters.Compatibility;
public sealed record FilterDependencies(bool LiveMarket,bool ClientType,bool OrderBook,bool History,bool InstrumentStatistics,IReadOnlyList<string> Fields);
public sealed class FilterDependencyAnalyzer
{
    public FilterDependencies Analyze(FilterExpression e){var f=new HashSet<string>(StringComparer.OrdinalIgnoreCase);Visit(e,f);return new(true,f.Contains("ct"),f.Any(IsBook),false,false,f.OrderBy(x=>x).ToArray());}
    private static void Visit(FilterExpression e,HashSet<string> f){switch(e){case FieldExpression x:f.Add(x.Code);break;case UnaryExpression u:Visit(u.Operand,f);break;case BinaryExpression b:Visit(b.Left,f);Visit(b.Right,f);break;case MemberExpression m:Visit(m.Target,f);break;case CallExpression c:Visit(c.Callee,f);foreach(var a in c.Arguments)Visit(a,f);break;case IndexExpression i:Visit(i.Target,f);Visit(i.Index,f);break;}}
    private static bool IsBook(string s)=>s.Length>=3&&(s.StartsWith("pd")||s.StartsWith("zd")||s.StartsWith("qd")||s.StartsWith("po")||s.StartsWith("zo")||s.StartsWith("qo"))&&char.IsDigit(s[^1]);
}
