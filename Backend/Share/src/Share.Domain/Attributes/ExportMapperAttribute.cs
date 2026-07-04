using Share.Domain.Enums;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Attributes
{
    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = false)]
    public class ExportMapperAttribute : Attribute
    {
        public ExportMapperAttribute(int order, string headerName, ExportDataType exportDataType)
        {
            ExportDataType = exportDataType;
            HeaderName = headerName;
            Order = order;
        }
        public ExportMapperAttribute(int order, string headerName, ExportDataType exportDataType, string childPropName)
        {
            ExportDataType = exportDataType;
            HeaderName = headerName;
            Order = order;
            ChildPropName = childPropName;
        }
        public int Order { get; set; }
        public string HeaderName { get; set; }
        public ExportDataType ExportDataType { get; set; }
        public string PropertyName { get; private set; }
        public string ChildPropName { get; set; }
        public void SetPropName(string propName)
        {
            PropertyName = propName;
        }
    }
}
