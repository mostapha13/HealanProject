using Share.Domain.Attributes;
using Share.Domain.Extensions;
using Share.Domain.Models;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Extensions
{
    public static class GetExportMapperAttributes
    {
        public static Dictionary<int, ExportMapperModel> GetExportMapperModels(this Type type, bool orderByAscending = true)
        {
            var properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            var attributes = new List<ExportMapperAttribute>();

            foreach (var property in properties)
            {
                var attribute = property.GetCustomAttribute<ExportMapperAttribute>();
                if (attribute != null)
                {
                    attribute.SetPropName(property.Name);
                    attributes.Add(attribute);
                }
            }
            if (orderByAscending)
                attributes = attributes.OrderBy(o => o.Order).ToList();
            else if (!orderByAscending)
                attributes = attributes.OrderByDescending(o => o.Order).ToList();

            var dic = new Dictionary<int, ExportMapperModel>();
            int i = 0;
            foreach (var item in attributes)
            {
                i++;
                string propName = item.PropertyName + (!string.IsNullOrEmpty(item.ChildPropName) ? "." + item.ChildPropName : string.Empty);
                ExportMapperModel excelMapperModel = new ExportMapperModel(item.HeaderName, propName, item.ExportDataType);
                dic.Add(i, excelMapperModel);
            }


            return dic;
        }
    }
}
