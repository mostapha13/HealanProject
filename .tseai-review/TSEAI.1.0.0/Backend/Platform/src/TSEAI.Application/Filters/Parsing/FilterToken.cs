namespace TSEAI.Application.Filters.Parsing;
public enum FilterTokenType { Number,String,Identifier,Field,Plus,Minus,Star,Slash,Percent,AndAnd,OrOr,Bang,EqEq,NotEq,Gt,Gte,Lt,Lte,LParen,RParen,Dot,Comma,LBracket,RBracket,End }
public readonly record struct FilterToken(FilterTokenType Type,string Text,int Position);
public sealed class FilterParseException(string message,int position):Exception($"{message} at position {position}"){public int Position{get;}=position;}
