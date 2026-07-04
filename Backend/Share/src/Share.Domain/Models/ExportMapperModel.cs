using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models
{
    public class ExportMapperModel
    {
        public ExportMapperModel(string headerName,string propertyName, ExportDataType excelDataType)
        {
            PropertyName = propertyName;
            ExportDataType = excelDataType;
            HeaderName = headerName;
        }
        public string HeaderName { get; set; }
        public string PropertyName { get; set; }
        public ExportDataType ExportDataType { get; set; }
    }
}
