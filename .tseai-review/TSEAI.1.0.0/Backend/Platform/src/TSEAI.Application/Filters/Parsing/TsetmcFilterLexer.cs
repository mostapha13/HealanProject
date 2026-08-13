using System.Globalization;

namespace TSEAI.Application.Filters.Parsing;

public sealed class TsetmcFilterLexer(string source)
{
    private int _position;
    private readonly string _source = source ?? string.Empty;

    public IReadOnlyList<FilterToken> Tokenize()
    {
        var tokens = new List<FilterToken>();
        FilterToken token;
        do
        {
            token = Next();
            tokens.Add(token);
        }
        while (token.Type != FilterTokenType.End);

        return tokens;
    }

    private FilterToken Next()
    {
        SkipWhiteSpace();
        if (_position >= _source.Length)
            return new(FilterTokenType.End, string.Empty, _position);

        var start = _position;
        var c = _source[_position];

        if (c == '(' && TryReadField(out var field))
            return new(FilterTokenType.Field, field, start);

        if (char.IsDigit(c))
            return ReadNumber();

        if (c == '\'' || c == '"')
            return ReadString();

        if (char.IsLetter(c) || c is '_' or '$')
            return ReadIdentifier();

        _position++;
        return c switch
        {
            '+' => new(FilterTokenType.Plus, "+", start),
            '-' => new(FilterTokenType.Minus, "-", start),
            '*' => new(FilterTokenType.Star, "*", start),
            '/' => new(FilterTokenType.Slash, "/", start),
            '%' => new(FilterTokenType.Percent, "%", start),
            '(' => new(FilterTokenType.LParen, "(", start),
            ')' => new(FilterTokenType.RParen, ")", start),
            '.' => new(FilterTokenType.Dot, ".", start),
            ',' => new(FilterTokenType.Comma, ",", start),
            '[' => new(FilterTokenType.LBracket, "[", start),
            ']' => new(FilterTokenType.RBracket, "]", start),
            '&' when Match('&') => new(FilterTokenType.AndAnd, "&&", start),
            '|' when Match('|') => new(FilterTokenType.OrOr, "||", start),
            '!' when Match('=') => new(FilterTokenType.NotEq, "!=", start),
            '!' => new(FilterTokenType.Bang, "!", start),
            '=' when Match('=') => new(FilterTokenType.EqEq, "==", start),
            '>' when Match('=') => new(FilterTokenType.Gte, ">=", start),
            '>' => new(FilterTokenType.Gt, ">", start),
            '<' when Match('=') => new(FilterTokenType.Lte, "<=", start),
            '<' => new(FilterTokenType.Lt, "<", start),
            _ => throw new FilterParseException($"Unexpected character '{c}'", start)
        };
    }

    private bool TryReadField(out string field)
    {
        field = string.Empty;
        var i = _position + 1;
        if (i >= _source.Length || !(char.IsLetter(_source[i]) || _source[i] == '_'))
            return false;

        var start = i;
        while (i < _source.Length && (char.IsLetterOrDigit(_source[i]) || _source[i] == '_'))
            i++;

        if (i >= _source.Length || _source[i] != ')')
            return false;

        field = _source[start..i];
        _position = i + 1;
        return true;
    }

    private FilterToken ReadNumber()
    {
        var start = _position;
        var hasDot = false;
        while (_position < _source.Length)
        {
            var c = _source[_position];
            if (char.IsDigit(c) || c == '_')
            {
                _position++;
                continue;
            }

            if (c == '.' && !hasDot)
            {
                hasDot = true;
                _position++;
                continue;
            }

            break;
        }

        var text = _source[start.._position].Replace("_", string.Empty, StringComparison.Ordinal);
        if (!decimal.TryParse(text, NumberStyles.Number, CultureInfo.InvariantCulture, out _))
            throw new FilterParseException("Invalid number", start);

        return new(FilterTokenType.Number, text, start);
    }

    private FilterToken ReadString()
    {
        var start = _position;
        var quote = _source[_position++];
        var builder = new System.Text.StringBuilder();

        while (_position < _source.Length)
        {
            var c = _source[_position++];
            if (c == quote)
                return new(FilterTokenType.String, builder.ToString(), start);

            if (c == '\\' && _position < _source.Length)
            {
                var escaped = _source[_position++];
                builder.Append(escaped switch
                {
                    'n' => '\n',
                    'r' => '\r',
                    't' => '\t',
                    '\\' => '\\',
                    '\'' => '\'',
                    '"' => '"',
                    _ => escaped
                });
            }
            else
            {
                builder.Append(c);
            }
        }

        throw new FilterParseException("Unterminated string", start);
    }

    private FilterToken ReadIdentifier()
    {
        var start = _position;
        while (_position < _source.Length &&
               (char.IsLetterOrDigit(_source[_position]) || _source[_position] is '_' or '$'))
        {
            _position++;
        }

        return new(FilterTokenType.Identifier, _source[start.._position], start);
    }

    private bool Match(char expected)
    {
        if (_position < _source.Length && _source[_position] == expected)
        {
            _position++;
            return true;
        }

        return false;
    }

    private void SkipWhiteSpace()
    {
        while (_position < _source.Length && char.IsWhiteSpace(_source[_position]))
            _position++;
    }
}
