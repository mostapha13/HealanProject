using System.Globalization;
using TSEAI.Application.Filters.Ast;
namespace TSEAI.Application.Filters.Parsing;
public sealed class TsetmcFilterParser
{
    private IReadOnlyList<FilterToken> _t=[]; private int _p;
    public FilterExpression Parse(string source){_t=new TsetmcFilterLexer(source).Tokenize();_p=0;var e=ParseOr();Expect(FilterTokenType.End);return e;}
    private FilterExpression ParseOr(){var e=ParseAnd();while(Match(FilterTokenType.OrOr,out var op))e=new BinaryExpression(op.Text,e,ParseAnd());return e;}
    private FilterExpression ParseAnd(){var e=ParseEquality();while(Match(FilterTokenType.AndAnd,out var op))e=new BinaryExpression(op.Text,e,ParseEquality());return e;}
    private FilterExpression ParseEquality(){var e=ParseComparison();while(MatchAny([FilterTokenType.EqEq,FilterTokenType.NotEq],out var op))e=new BinaryExpression(op.Text,e,ParseComparison());return e;}
    private FilterExpression ParseComparison(){var e=ParseTerm();while(MatchAny([FilterTokenType.Gt,FilterTokenType.Gte,FilterTokenType.Lt,FilterTokenType.Lte],out var op))e=new BinaryExpression(op.Text,e,ParseTerm());return e;}
    private FilterExpression ParseTerm(){var e=ParseFactor();while(MatchAny([FilterTokenType.Plus,FilterTokenType.Minus],out var op))e=new BinaryExpression(op.Text,e,ParseFactor());return e;}
    private FilterExpression ParseFactor(){var e=ParseUnary();while(MatchAny([FilterTokenType.Star,FilterTokenType.Slash,FilterTokenType.Percent],out var op))e=new BinaryExpression(op.Text,e,ParseUnary());return e;}
    private FilterExpression ParseUnary(){if(MatchAny([FilterTokenType.Bang,FilterTokenType.Minus,FilterTokenType.Plus],out var op))return new UnaryExpression(op.Text,ParseUnary());return ParsePostfix();}
    private FilterExpression ParsePostfix()
    {
        var e=ParsePrimary(); while(true)
        {
            if(Match(FilterTokenType.Dot,out _)){var m=Expect(FilterTokenType.Identifier);e=new MemberExpression(e,m.Text);continue;}
            if(Match(FilterTokenType.LParen,out _)){var args=new List<FilterExpression>();if(Current.Type!=FilterTokenType.RParen){do{args.Add(ParseOr());}while(Match(FilterTokenType.Comma,out _));}Expect(FilterTokenType.RParen);e=new CallExpression(e,args);continue;}
            if(Match(FilterTokenType.LBracket,out _)){var idx=ParseOr();Expect(FilterTokenType.RBracket);e=new IndexExpression(e,idx);continue;}
            break;
        } return e;
    }
    private FilterExpression ParsePrimary()
    {
        if(Match(FilterTokenType.Number,out var n))return new LiteralExpression(decimal.Parse(n.Text,CultureInfo.InvariantCulture)); if(Match(FilterTokenType.String,out var s))return new LiteralExpression(s.Text); if(Match(FilterTokenType.Field,out var f))return new FieldExpression(f.Text);
        if(Match(FilterTokenType.Identifier,out var id)){if(id.Text.Equals("true",StringComparison.OrdinalIgnoreCase))return new LiteralExpression(true);if(id.Text.Equals("false",StringComparison.OrdinalIgnoreCase))return new LiteralExpression(false);return new IdentifierExpression(id.Text);}
        if(Match(FilterTokenType.LParen,out _)){var e=ParseOr();Expect(FilterTokenType.RParen);return e;} throw new FilterParseException("Expected expression",Current.Position);
    }
    private FilterToken Current=>_t[Math.Min(_p,_t.Count-1)]; private bool Match(FilterTokenType type,out FilterToken token){if(Current.Type==type){token=Current;_p++;return true;}token=default;return false;}
    private bool MatchAny(FilterTokenType[] types,out FilterToken token){foreach(var t in types)if(Match(t,out token))return true;token=default;return false;}
    private FilterToken Expect(FilterTokenType type){if(Current.Type!=type)throw new FilterParseException($"Expected {type}, got {Current.Type}",Current.Position);return _t[_p++];}
}
