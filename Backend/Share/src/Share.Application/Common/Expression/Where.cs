using DynamicExpresso;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Expression
{
    public static class Where
    {
        public static Expression<Func<T, bool>> ToFilterFunc<T>(this IEnumerable<WhereModel> WhereModels) where T : new()
        {
            if (WhereModels == null || !WhereModels.Any())
            {
                return null;
            }
            else
            {
                Expression<Func<T, bool>> expression = null;

                string whereExpression = GetExpressionOnAllFields(new T(), WhereModels);
                var interpreter = new Interpreter();
                expression = interpreter.ParseAsExpression<Func<T, bool>>(whereExpression, typeof(T).Name);
                return expression;
            }
        }
        private static string GetExpressionOnAllFields(object model, IEnumerable<WhereModel> whereModels)
        {
            string condition = string.Empty;
            int counter = 0;
            foreach (var where in whereModels)
            {

                var prop = GetTrueProp(model, where.PropName);

                if (prop == null)
                    continue;

                if (prop.PropertyType == typeof(string) && prop.SetMethod != null)
                {
                    condition += string.Format("{0}.{1}.Contains(\"{2}\") ", model.GetType().Name, prop.Name, where.PropValue);
                }
                else
                    continue;

                counter++;

                if (counter < whereModels.Count())
                {
                    condition += " " + GetTrueAndOrOperand(where.Operand)+" ";
                }
            }
            return condition;
        }

        private static PropertyInfo GetTrueProp(object model, string propName)
        {
            PropertyInfo LastProp = null;
            PropertyInfo[] props = model.GetType().GetProperties();
            var allColumn = propName.Split(".");
            foreach (var ColumnName in allColumn)
            {
                var p1 = props.FirstOrDefault(a => a.Name.ToLower() == ColumnName.ToLower());
                if (p1 == null)
                    return null;
                LastProp = p1;

                var constructor = p1.PropertyType.GetConstructor(Type.EmptyTypes);
                if (constructor != null)
                {
                    model = Activator.CreateInstance(p1.PropertyType);

                    if (model != null)
                        props = model.GetType().GetProperties();
                }
            }
            return LastProp;
        }
        private static string GetTrueAndOrOperand(string operand)
        {
            operand = operand.ToLower().Trim();
            if (operand == "and" || operand == "&" || operand == "&&")
                return "&&";
            return "||";
        }
    }
}
