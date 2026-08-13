using System.Globalization;
using TSEAI.Application.Filters.Ast;
using TSEAI.Shared.Application.Market;
namespace TSEAI.Application.Filters.Execution;
public sealed class FilterEvaluator
{
    public bool Evaluate(FilterExpression expression,MarketSymbolSnapshot symbol)=>Bool(Eval(expression,symbol));
    public object? Eval(FilterExpression e,MarketSymbolSnapshot s)=>e switch
    {
        LiteralExpression x=>x.Value, FieldExpression f=>Field(f,s), IdentifierExpression i=>i.Name, UnaryExpression u=>Unary(u,s), BinaryExpression b=>Binary(b,s), MemberExpression m=>Member(m,s), CallExpression c=>Call(c,s), IndexExpression i=>Index(i,s), _=>throw new NotSupportedException(e.GetType().Name)
    };
    private static object? Field(FieldExpression f,MarketSymbolSnapshot s)=>TsetmcFieldRegistry.TryGet(f.Code,out var d)?d.Getter(s):throw new InvalidOperationException($"Unsupported field ({f.Code})");
    private object? Unary(UnaryExpression u,MarketSymbolSnapshot s){var v=Eval(u.Operand,s);return u.Operator switch{"!"=>!Bool(v),"-"=>-Num(v),"+"=>Num(v),_=>throw new InvalidOperationException()};}
    private object? Binary(BinaryExpression b,MarketSymbolSnapshot s)
    {
        if (b.Operator == "&&") { var left = Eval(b.Left, s); return Bool(left) ? Eval(b.Right, s) : left; }
        if (b.Operator == "||") { var left = Eval(b.Left, s); return Bool(left) ? left : Eval(b.Right, s); }
        var a=Eval(b.Left,s);var c=Eval(b.Right,s);
        return b.Operator switch
        {
            "+"=>Add(a,c), "-"=>Num(a)-Num(c), "*"=>Num(a)*Num(c), "/"=>Num(a)/Num(c), "%"=>Num(a)%Num(c),
            "=="=>Eq(a,c), "!="=>!Eq(a,c),
            ">"=>Rel(a,c,(x,y)=>x>y,comparison=>comparison>0),
            ">="=>Rel(a,c,(x,y)=>x>=y,comparison=>comparison>=0),
            "<"=>Rel(a,c,(x,y)=>x<y,comparison=>comparison<0),
            "<="=>Rel(a,c,(x,y)=>x<=y,comparison=>comparison<=0),
            _=>throw new InvalidOperationException($"Unknown operator {b.Operator}")
        };
    }
    private object? Member(MemberExpression m,MarketSymbolSnapshot s)
    {
        var target=Eval(m.Target,s);
        if(target is ClientTypeSnapshot ct)return m.Member switch{"Buy_CountI"=>(double)ct.BuyCountI,"Buy_CountN"=>(double)ct.BuyCountN,"Buy_I_Volume"=>(double)ct.BuyIVolume,"Buy_N_Volume"=>(double)ct.BuyNVolume,"Sell_CountI"=>(double)ct.SellCountI,"Sell_CountN"=>(double)ct.SellCountN,"Sell_I_Volume"=>(double)ct.SellIVolume,"Sell_N_Volume"=>(double)ct.SellNVolume,_=>throw new InvalidOperationException($"Unknown ct member {m.Member}")};
        if(target is string str&&m.Member=="length")return (double)str.Length;
        if(target is string math&&math=="Math")return "Math."+m.Member;
        return new BoundMember(target,m.Member);
    }
    private object? Call(CallExpression c,MarketSymbolSnapshot s)
    {
        var callee=Eval(c.Callee,s);var args=c.Arguments.Select(x=>Eval(x,s)).ToArray();
        if(callee is BoundMember bm&&bm.Target is string str&&bm.Name=="indexOf")return (double)str.IndexOf(Convert.ToString(args.ElementAtOrDefault(0),CultureInfo.InvariantCulture)??"",StringComparison.Ordinal);
        if(callee is string fn&&fn.StartsWith("Math.")){var n=args.Select(Num).ToArray();return fn[5..].ToLowerInvariant() switch{"abs"=>Math.Abs(n[0]),"ceil"=>Math.Ceiling(n[0]),"floor"=>Math.Floor(n[0]),"max"=>n.Max(),"min"=>n.Min(),"pow"=>Math.Pow(n[0],n[1]),"round"=>Math.Floor(n[0]+0.5d),"sqrt"=>Math.Sqrt(n[0]),"exp"=>Math.Exp(n[0]),"log"=>Math.Log(n[0]),_=>throw new InvalidOperationException(fn)};}
        throw new InvalidOperationException("Unsupported function call");
    }
    private object? Index(IndexExpression i,MarketSymbolSnapshot s){var target=Eval(i.Target,s);var idx=(int)Num(Eval(i.Index,s));if(target is string str)return idx>=0&&idx<str.Length?str[idx].ToString():"";throw new InvalidOperationException("Indexing is supported for strings in V1");}
    private sealed record BoundMember(object? Target,string Name);
    private static object Add(object? a,object? b)=>a is string||b is string?(Convert.ToString(a,CultureInfo.InvariantCulture)??"")+(Convert.ToString(b,CultureInfo.InvariantCulture)??""):Num(a)+Num(b);
    private static double Num(object? x)=>x switch{null=>0d,double d=>d,float f=>f,decimal d=>(double)d,int i=>i,long l=>l,bool b=>b?1d:0d,string s when double.TryParse(s,NumberStyles.Any,CultureInfo.InvariantCulture,out var n)=>n,_=>Convert.ToDouble(x,CultureInfo.InvariantCulture)};
    private static bool Bool(object? x)=>x switch{bool b=>b,null=>false,string s=>!string.IsNullOrEmpty(s),_=>!double.IsNaN(Num(x))&&Num(x)!=0d};
    private static bool Eq(object? a,object? b){if(a is string&&b is string)return string.Equals((string)a,(string)b,StringComparison.Ordinal);try{return Num(a)==Num(b);}catch{return Equals(a,b);}}
    private static bool Rel(object? a,object? b,Func<double,double,bool> numeric,Func<int,bool> textual)
    {
        if(a is string sa&&b is string sb)return textual(string.Compare(sa,sb,StringComparison.Ordinal));
        try{var x=Num(a);var y=Num(b);return !double.IsNaN(x)&&!double.IsNaN(y)&&numeric(x,y);}catch{return false;}
    }
}
