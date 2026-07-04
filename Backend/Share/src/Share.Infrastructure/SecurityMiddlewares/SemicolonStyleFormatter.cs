

using AngleSharp;
using AngleSharp.Css;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace Share.Infrastructure.SecurityMiddlewares
{
   public class SemicolonStyleFormatter : IStyleFormatter
    {
        public string BlockDeclarations(IEnumerable<IStyleFormattable> declarations)
        {
            var sb = new StringBuilder().Append('{');

            using (var writer = new StringWriter(sb))
            {
                foreach (var declaration in declarations)
                {
                    writer.Write(' ');
                    declaration.ToCss(writer, this);
                    writer.Write(';');
                }
            }

            return sb.Append(' ').Append('}').ToString();
        }

        public string BlockRules(IEnumerable<IStyleFormattable> rules) => CssStyleFormatter.Instance.BlockRules(rules);

        public string Comment(string data) => CssStyleFormatter.Instance.Comment(data);

        public string Declaration(string name, string value, bool important) => CssStyleFormatter.Instance.Declaration(name, value, important);

        public string Rule(string name, string value) => CssStyleFormatter.Instance.Rule(name, value);

        public string Rule(string name, string prelude, string rules) => CssStyleFormatter.Instance.Rule(name, prelude, rules);

        public string Sheet(IEnumerable<IStyleFormattable> rules) => CssStyleFormatter.Instance.Sheet(rules);
    }
}
