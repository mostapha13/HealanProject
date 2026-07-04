using Share.Application.Common.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using System.IO;
using Share.Domain.Models;
using Share.Domain.Extensions;

using WkHtmlToPdfDotNet.Contracts;
using WkHtmlToPdfDotNet;
using System.Reflection;
using System.ComponentModel.DataAnnotations;

namespace Share.Infrastructure.Services
{
    public class DocumentManagement : IDocumentManagement
    {
        private readonly IConverter _generatePdf;
        public DocumentManagement(IConverter generatePdf)
        {
            _generatePdf = generatePdf;
        }
        public async Task<Dictionary<int, Dictionary<int, object>>> GetContent(byte[] content)
        {
            Stream stream = new MemoryStream(content);
            using (SpreadsheetDocument doc = SpreadsheetDocument.Open(stream, false))
            {
                WorkbookPart workbookPart = doc.WorkbookPart;
                SharedStringTablePart sstpart = workbookPart.GetPartsOfType<SharedStringTablePart>().First();
                DocumentFormat.OpenXml.Spreadsheet.SharedStringTable sst = sstpart.SharedStringTable;

                WorksheetPart worksheetPart = workbookPart.WorksheetParts.First();
                DocumentFormat.OpenXml.Spreadsheet.Worksheet sheet = worksheetPart.Worksheet;

                var cells = sheet.Descendants<DocumentFormat.OpenXml.Spreadsheet.Cell>();
                var rows = sheet.Descendants<DocumentFormat.OpenXml.Spreadsheet.Row>();
                Dictionary<int, Dictionary<int, object>> mainDic = new Dictionary<int, Dictionary<int, object>>();
                int rowNumber = 0;
                foreach (DocumentFormat.OpenXml.Spreadsheet.Row row in rows)
                {
                    rowNumber++;
                    var rowDic = new Dictionary<int, object>();
                    mainDic.Add(rowNumber, rowDic);
                    int cellNumber = 0;
                    foreach (DocumentFormat.OpenXml.Spreadsheet.Cell c in row.Elements<DocumentFormat.OpenXml.Spreadsheet.Cell>())
                    {
                        if ((c.DataType != null) && (c.DataType == DocumentFormat.OpenXml.Spreadsheet.CellValues.SharedString))
                        {
                            cellNumber++;
                            int ssid = int.Parse(c.CellValue.Text);
                            string str = sst.ChildElements[ssid].InnerText;

                            rowDic.Add(cellNumber, str);
                            //Console.WriteLine("Shared string {0}: {1}", ssid, str);
                        }
                        else if (c.CellValue != null)
                        {
                            cellNumber++;
                            rowDic.Add(cellNumber, c.CellValue.Text);
                            //Console.WriteLine("Cell contents: {0}", c.CellValue.Text);
                        }
                    }
                }

                return mainDic;
            }
        }

        public List<TReponse> MapToModel<TReponse>(Dictionary<int, Dictionary<int, object>> dicSource, Dictionary<int, ExportMapperModel> dicMaper) where TReponse : new()
        {
            List<TReponse> reponses = new List<TReponse>();
            foreach (var row in dicSource)
            {
                if (row.Key == 1 || row.Value.Count != dicMaper.Count)
                    continue;
                TReponse reponse = new TReponse();
                reponses.Add(reponse);
                foreach (var cell in row.Value)
                {
                    if (!dicMaper.ContainsKey(cell.Key))
                        continue;
                    var mapper = dicMaper[cell.Key];
                    var prop = reponse.GetType().GetProperty(mapper.PropertyName);
                    if (prop == null)
                        continue;

                    var cellValue = cell.Value.ToString().Replace("ك", "ک").Replace("ي", "ی").Trim();
                    switch (mapper.ExportDataType)
                    {
                        case Domain.Enums.ExportDataType.String:
                            prop.SetValue(reponse, cellValue);
                            break;
                        case Domain.Enums.ExportDataType.Int:
                            prop.SetValue(reponse, cellValue.ToInt() ?? 0);
                            break;
                        case Domain.Enums.ExportDataType.Percent:
                            var val = cellValue.Replace("%", "").ToDouble() ?? 0;
                            prop.SetValue(reponse, (int)(val * 100));
                            break;
                        case Domain.Enums.ExportDataType.Double:
                            prop.SetValue(reponse, cellValue.ToString().ToDouble() ?? (double)0);
                            break;
                        case Domain.Enums.ExportDataType.Long:
                            prop.SetValue(reponse, cellValue.ToString().ToLong() ?? (long)0);
                            break;
                        case Domain.Enums.ExportDataType.Decimal:
                            prop.SetValue(reponse, cellValue.ToString().ToDecimal() ?? (decimal)0);
                            break;
                        case Domain.Enums.ExportDataType.Date:
                            prop.SetValue(reponse, DateTimeHelper.ToGregorianDate(cellValue.ToString()));
                            break;
                        case Domain.Enums.ExportDataType.DateTime:
                            prop.SetValue(reponse, DateTimeHelper.ToGregorianDate(cellValue.ToString()));
                            break;
                    }
                }
            }
            return reponses;
        }

        public async Task<byte[]> SetParameter(string sourceTemplatePath, Dictionary<string, string> parameters)
        {
            byte[] byteArray = File.ReadAllBytes(sourceTemplatePath);
            using (MemoryStream stream = new MemoryStream())
            {
                stream.Write(byteArray, 0, byteArray.Length);
                using (WordprocessingDocument docPackage = WordprocessingDocument.Open(stream, true))
                {
                    var allBodytext = docPackage.MainDocumentPart.Document.Body.Descendants<DocumentFormat.OpenXml.Wordprocessing.Text>().Where(w => w.Text.Contains("@")).ToList();
                    var allHeader = docPackage.MainDocumentPart.HeaderParts.Select(a => a.Header);

                    foreach (var header in allHeader)
                    {
                        allBodytext.AddRange(header.Descendants<DocumentFormat.OpenXml.Wordprocessing.Text>().Where(w => w.Text.Contains("@")));
                    }


                    foreach (var text in allBodytext)
                    {
                        foreach (var item in parameters)
                        {
                            text.Text = text.Text.Replace(item.Key, item.Value);
                        }
                    }
                }
                return stream.ToArray();
            }
        }

        public async Task<byte[]> SetParameterPersian(string sourceTemplatePath, Dictionary<string, string> parameters)
        {

            byte[] byteArray = File.ReadAllBytes(sourceTemplatePath);
            using (MemoryStream stream = new MemoryStream())
            {
                stream.Write(byteArray, 0, byteArray.Length);
                using (WordprocessingDocument docPackage = WordprocessingDocument.Open(stream, true))
                {
                    var allBodytext = docPackage.MainDocumentPart.Document.Body.Descendants<DocumentFormat.OpenXml.Wordprocessing.Text>().ToList();
                    var allHeader = docPackage.MainDocumentPart.HeaderParts.Select(a => a.Header);

                    foreach (var header in allHeader)
                    {
                        allBodytext.AddRange(header.Descendants<DocumentFormat.OpenXml.Wordprocessing.Text>());
                    }

                    foreach (var text in allBodytext)
                    {                        
                            foreach (var item in parameters)
                            {
                                text.Text = text.Text.Replace(item.Key, item.Value);
                            }   
                    }
                }
                return stream.ToArray();
            }

        }



        public byte[] ExportToExcel<TData>(List<TData> dataSource, string sheetName, Dictionary<int, ExportMapperModel> dicMaper) where TData : new()
        {
            // https://stackoverflow.com/questions/11811143/export-datatable-to-excel-with-open-xml-sdk-in-c-sharp
            using (MemoryStream stream = new MemoryStream())
            {
                using (var workbook = SpreadsheetDocument.Create(stream, DocumentFormat.OpenXml.SpreadsheetDocumentType.Workbook))
                {
                    var workbookPart = workbook.AddWorkbookPart();
                    workbook.WorkbookPart.Workbook = new DocumentFormat.OpenXml.Spreadsheet.Workbook();
                    workbook.WorkbookPart.Workbook.Sheets = new DocumentFormat.OpenXml.Spreadsheet.Sheets();

                    uint sheetId = 1;


                    var sheetPart = workbook.WorkbookPart.AddNewPart<WorksheetPart>();
                    var sheetData = new DocumentFormat.OpenXml.Spreadsheet.SheetData();
                    sheetPart.Worksheet = new DocumentFormat.OpenXml.Spreadsheet.Worksheet(sheetData);

                    DocumentFormat.OpenXml.Spreadsheet.Sheets sheets = workbook.WorkbookPart.Workbook.GetFirstChild<DocumentFormat.OpenXml.Spreadsheet.Sheets>();
                    string relationshipId = workbook.WorkbookPart.GetIdOfPart(sheetPart);

                    if (sheets.Elements<DocumentFormat.OpenXml.Spreadsheet.Sheet>().Count() > 0)
                    {
                        sheetId =
                            sheets.Elements<DocumentFormat.OpenXml.Spreadsheet.Sheet>().Select(s => s.SheetId.Value).Max() + 1;
                    }

                    DocumentFormat.OpenXml.Spreadsheet.Sheet sheet = new DocumentFormat.OpenXml.Spreadsheet.Sheet() { Id = relationshipId, SheetId = sheetId, Name = sheetName };
                    sheets.Append(sheet);

                    DocumentFormat.OpenXml.Spreadsheet.Row headerRow = new DocumentFormat.OpenXml.Spreadsheet.Row();

                    List<string> columns = new List<string>();
                    foreach (var column in dicMaper)
                    {
                        columns.Add(column.Value.PropertyName);

                        DocumentFormat.OpenXml.Spreadsheet.Cell cell = new DocumentFormat.OpenXml.Spreadsheet.Cell();
                        cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.String;
                        cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(column.Value.HeaderName);
                        headerRow.AppendChild(cell);
                    }

                    sheetData.AppendChild(headerRow);

                    foreach (var dsrow in dataSource)
                    {
                        DocumentFormat.OpenXml.Spreadsheet.Row newRow = new DocumentFormat.OpenXml.Spreadsheet.Row();
                        foreach (var column in dicMaper)
                        {
                            DocumentFormat.OpenXml.Spreadsheet.Cell cell = new DocumentFormat.OpenXml.Spreadsheet.Cell();
                            cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.String;

                            object originalValue = null;
                            var value = "";
                            if (!column.Value.PropertyName.Contains("."))
                            {
                                var prop = dsrow.GetType().GetProperty(column.Value.PropertyName);
                                if (prop != null)
                                    originalValue = prop.GetValue(dsrow);
                            }
                            else
                            {
                                var propNames = column.Value.PropertyName.Split('.');
                                object objValue = dsrow;
                                foreach (var item in propNames)
                                {
                                    if (objValue == null)
                                        break;
                                    objValue = objValue.GetType().GetProperty(item).GetValue(objValue);
                                }
                                originalValue = objValue;
                            }
                            if (originalValue != null && originalValue.GetType().IsEnum)
                            {
                                value = GetEnumDisplayName(originalValue);
                            }
                            else if (originalValue != null)
                                value = originalValue.ToString();


                            switch (column.Value.ExportDataType)
                            {
                                case Domain.Enums.ExportDataType.String:
                                    cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.String;
                                    cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(value);
                                    break;
                                case Domain.Enums.ExportDataType.Percent:
                                    cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.Number;
                                    cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(value.ToDecimal() ?? 0);
                                    break;
                                case Domain.Enums.ExportDataType.Int:
                                    cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.Number;
                                    cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(value.ToInt() ?? 0);
                                    break;
                                case Domain.Enums.ExportDataType.Double:
                                    cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.Number;
                                    cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(value.ToDouble() ?? 0);
                                    break;
                                case Domain.Enums.ExportDataType.Long:
                                    cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.Number;
                                    cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(value.ToDecimal() ?? 0);
                                    break;
                                case Domain.Enums.ExportDataType.Decimal:
                                    cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.Number;
                                    cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(value.ToDecimal() ?? 0);
                                    break;
                                case Domain.Enums.ExportDataType.Date:
                                    if (originalValue is DateTime)
                                    {
                                        cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.String;
                                        cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(DateTimeHelper.ConvertToPersianDateTime((DateTime)originalValue));
                                    }
                                   else if (originalValue is int || originalValue is long || originalValue is decimal)
                                    {
                                        cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.String;
                                        cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(DateTimeHelper.ConvertNumberToPersianDateTime((int)originalValue));
                                    }
                                    break;
                                case Domain.Enums.ExportDataType.DateTime:
                                    if (originalValue is DateTime)
                                    {
                                        cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.String;
                                        cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(DateTimeHelper.ConvertToFullPersianDateTime((DateTime)originalValue));
                                    }
                                    break;
                                default:
                                    cell.DataType = DocumentFormat.OpenXml.Spreadsheet.CellValues.String;
                                    cell.CellValue = new DocumentFormat.OpenXml.Spreadsheet.CellValue(value);
                                    break;
                            }
                            newRow.AppendChild(cell);
                        }

                        sheetData.AppendChild(newRow);
                    }
                }
                return stream.ToArray();
            }

        }
        public byte[] ExportToExcel<TData>(List<TData> dataSource, string sheetName) where TData : new()
        {
            var dicMaper = typeof(TData).GetExportMapperModels();
            return ExportToExcel(dataSource, sheetName, dicMaper);

        }


        public byte[] ExportToPdf<TData>(List<TData> dataSource, string headerName)
        {
            var headers = typeof(TData).GetExportMapperModels(false);

            var htmlContent = GenerateHtml(dataSource, headers, headerName);

            var doc = new HtmlToPdfDocument()
            {
                GlobalSettings = {
        ColorMode = ColorMode.Color,
        Orientation = Orientation.Landscape,
        PaperSize =headers.Count<20? PaperKind.A4Plus:PaperKind.A3Extra,
    },
                Objects = {
        new ObjectSettings() {
            PagesCount = true,
            HtmlContent =htmlContent,
            WebSettings = { DefaultEncoding = "utf-8" },
            HeaderSettings = { FontSize = 9, Right = "Page [page] of [toPage]", Line = true, Spacing = 2.812 }
        }
    }
            };
            var pdf = _generatePdf.Convert(doc);
            return pdf;


        }


        public void ApplyPersianFont(Run run)
        {
            // Create a new RunProperties object
            RunProperties runProperties = new RunProperties();

            // Set the RunFont to B Zar (Persian font)
            RunFonts runFonts = new RunFonts() { Ascii = "B Zar", HighAnsi = "B Zar", ComplexScript = "B Zar" };
            runProperties.Append(runFonts);

            // Optionally set the font size (in half-points)
            FontSize fontSize = new FontSize() { Val = "24" }; // 24 half-points = 12pt font size
            runProperties.Append(fontSize);

            // Apply the run properties to the Run element
            run.PrependChild(runProperties);
        }


        private string GenerateHtml<TData>(List<TData> dataSource, Dictionary<int, ExportMapperModel> headers, string headerName)
        {

            var html = @"
    <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f0f0f5;
                    margin: 0;
                    padding: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background-color: #808080;
                    color: white;
                }
                tr:nth-child(even) {
                    background-color: #f2f2f2;
                }
                tr:hover {
                    background-color: #ddd;
                }
                .header {
                    text-align: center;
                    padding: 10px;
                    background-color: #808080;
                    color: white;
                    margin-bottom: 20px;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class='header'>
                <h1>" + headerName + @"</h1>
            </div>
            <table>
                <tr>";

            foreach (var header in headers.OrderBy(h => h.Key))
            {
                html += $"<th>{header.Value.HeaderName}</th>";
            }

            html += "</tr>";

            foreach (var data in dataSource)
            {
                html += "<tr>";
                foreach (var header in headers.OrderBy(h => h.Key))
                {
                    //var value = data.GetType().GetProperty(header.Value.PropertyName).GetValue(data, null);
                    object value = null;
                    if (!header.Value.PropertyName.Contains("."))
                    {
                        var prop = data.GetType().GetProperty(header.Value.PropertyName);
                        if (prop != null)
                            value = prop.GetValue(data);
                    }
                    else
                    {
                        var propNames = header.Value.PropertyName.Split('.');
                        object objValue = data;
                        foreach (var item in propNames)
                        {
                            if (objValue == null)
                                break;
                            objValue = objValue.GetType().GetProperty(item).GetValue(objValue);
                        }
                        value = objValue;
                    }
                    if (value != null && value.GetType().IsEnum)
                        value = GetEnumDisplayName(value);

                    if (header.Value.ExportDataType == Domain.Enums.ExportDataType.Date)
                    {
                        if (value is DateTime)
                        {
                            value = DateTimeHelper.ConvertToPersianDateTime((DateTime)value);
                        }
                        else if (value is int || value is long || value is decimal)
                        {
                            value = DocumentFormat.OpenXml.Spreadsheet.CellValues.String;
                            value = DateTimeHelper.ConvertNumberToPersianDateTime((int)value);
                        }
                    }
                    else if (header.Value.ExportDataType == Domain.Enums.ExportDataType.DateTime)
                    {
                        if (value is DateTime)
                        {
                            value = DateTimeHelper.ConvertToFullPersianDateTime((DateTime)value);
                        }
                    }


                    html += $"<td>{value}</td>";
                }
                html += "</tr>";
            }

            html += @"
            </table>
        </body>
    </html>";

            return html;

        }
        private string GetEnumDisplayName(object enumValue)
        {
            var type = enumValue.GetType();
            var field = type.GetField(enumValue.ToString());
            var displayNameAttr = field.GetCustomAttribute<DisplayAttribute>();

            return displayNameAttr != null ? displayNameAttr.Name : enumValue.ToString();
        }
    }

}


