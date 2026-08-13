using TSEAI.Application.Filters.Ast;
using TSEAI.Application.Filters.Execution;
namespace TSEAI.Application.Filters.Compatibility;
public sealed class FilterExplainer
{
    public string Explain(FilterExpression e)=>e switch
    {
        BinaryExpression {Operator:"&&"} b=>$"{Explain(b.Left)} و {Explain(b.Right)}",
        BinaryExpression {Operator:"||"} b=>$"{Explain(b.Left)} یا {Explain(b.Right)}",
        BinaryExpression b=>$"{Explain(b.Left)} {Op(b.Operator)} {Explain(b.Right)}",
        UnaryExpression {Operator:"!"} u=>$"نقیض ({Explain(u.Operand)})",
        UnaryExpression u=>$"{u.Operator}{Explain(u.Operand)}",
        FieldExpression f=>TsetmcFieldRegistry.TryGet(f.Code,out var d)?d.PersianName:$"({f.Code})",
        LiteralExpression l=>Convert.ToString(l.Value,System.Globalization.CultureInfo.InvariantCulture)??"null",
        MemberExpression {Target:FieldExpression {Code:"ct"}} m=>Ct(m.Member),
        MemberExpression m=>$"{Explain(m.Target)}.{m.Member}",
        CallExpression c=>$"{Explain(c.Callee)}({string.Join("، ",c.Arguments.Select(Explain))})",
        IndexExpression i=>$"کاراکتر {Explain(i.Index)} از {Explain(i.Target)}",
        IdentifierExpression i=>i.Name,
        _=>e.ToString()??""
    };
    private static string Op(string op)=>op switch{">"=>"بیشتر از",">="=>"بیشتر یا مساوی","<"=>"کمتر از","<="=>"کمتر یا مساوی","=="=>"مساوی","!="=>"مخالف","+"=>"به‌علاوه","-"=>"منهای","*"=>"ضربدر","/"=>"تقسیم بر","%"=>"باقیمانده تقسیم",_=>op};
    private static string Ct(string m)=>m switch{"Buy_CountI"=>"تعداد خریدار حقیقی","Buy_CountN"=>"تعداد خریدار حقوقی","Buy_I_Volume"=>"حجم خرید حقیقی","Buy_N_Volume"=>"حجم خرید حقوقی","Sell_CountI"=>"تعداد فروشنده حقیقی","Sell_CountN"=>"تعداد فروشنده حقوقی","Sell_I_Volume"=>"حجم فروش حقیقی","Sell_N_Volume"=>"حجم فروش حقوقی",_=>m};
}
