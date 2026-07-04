using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DocumentFormat.OpenXml.Wordprocessing;

namespace Share.Application.Common.Interfaces
{
    public interface IDocumentManagement
    {
        Task<byte[]> SetParameter(string sourceTemplatePath, Dictionary<string, string> parameters);
        Task<byte[]> SetParameterPersian(string sourceTemplatePath, Dictionary<string, string> parameters);
        void ApplyPersianFont(Run run);

        Task<Dictionary<int,Dictionary<int,object>>> GetContent(byte[] content);
        List<TReponse> MapToModel<TReponse>(Dictionary<int, Dictionary<int, object>> dicSource, Dictionary<int, ExportMapperModel> dicMaper) where TReponse : new();
        byte[] ExportToExcel<TData>(List<TData> dataSource, string sheetName, Dictionary<int, ExportMapperModel> dicMaper) where TData : new();
        byte[] ExportToExcel<TData>(List<TData> dataSource, string sheetName) where TData : new();
        byte[] ExportToPdf<TData>(List<TData> dataSource, string headerNameName);
    }
}
