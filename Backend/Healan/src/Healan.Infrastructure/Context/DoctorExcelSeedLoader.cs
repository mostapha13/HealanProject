using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using Healan.Domain.Insurances.Enums;
using Healan.Domain.MedicalFeeServices.Enums;

namespace Healan.Infrastructure.Context;

/// <summary>
/// خواندن داده‌های seed از فایل Docs/Doctor.xlsx (Sheet1).
/// </summary>
public static class DoctorExcelSeedLoader
{
    public sealed record ServiceSeedRow(
        string Title,
        string Code,
        CategoryTypeId Category,
        long Price,
        string Description);

    public sealed record InsuranceSeedRow(
        string Name,
        string Code,
        InsuranceTypeId InsuranceType);

    public static string ResolveDoctorExcelPath()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "Docs", "Doctor.xlsx");
            if (File.Exists(candidate))
                return candidate;

            dir = dir.Parent;
        }

        // مسیر توسعه: از پوشه WebApi به ریشه solution
        var devCandidate = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..", "..", "Docs", "Doctor.xlsx"));
        if (File.Exists(devCandidate))
            return devCandidate;

        throw new FileNotFoundException("فایل Doctor.xlsx در پوشه Docs یافت نشد.");
    }

    public static (List<ServiceSeedRow> Services, List<InsuranceSeedRow> Insurances) LoadSeedData(string? excelPath = null)
    {
        excelPath ??= ResolveDoctorExcelPath();
        var services = new List<ServiceSeedRow>();
        var insurances = new List<InsuranceSeedRow>();

        using var document = SpreadsheetDocument.Open(excelPath, false);
        var workbookPart = document.WorkbookPart
            ?? throw new InvalidOperationException("WorkbookPart نامعتبر است.");

        var sheet = workbookPart.Workbook.Descendants<Sheet>()
            .FirstOrDefault(s => s.Name == "Sheet1")
            ?? throw new InvalidOperationException("Sheet1 در Doctor.xlsx یافت نشد.");

        var worksheetPart = (WorksheetPart)workbookPart.GetPartById(sheet.Id!);
        var sheetData = worksheetPart.Worksheet.GetFirstChild<SheetData>()
            ?? throw new InvalidOperationException("SheetData خالی است.");

        var sharedStrings = workbookPart.SharedStringTablePart?.SharedStringTable;
        var rows = sheetData.Elements<Row>().Skip(1);

        foreach (var row in rows)
        {
            var cells = row.Elements<Cell>().ToList();
            var microservice = GetCellValue(cells, sharedStrings, "A", row.RowIndex);
            var controller = GetCellValue(cells, sharedStrings, "B", row.RowIndex);
            var action = GetCellValue(cells, sharedStrings, "C", row.RowIndex);
            var description = GetCellValue(cells, sharedStrings, "D", row.RowIndex);
            var addition = GetCellValue(cells, sharedStrings, "E", row.RowIndex);

            if (string.IsNullOrWhiteSpace(controller) || action != "Seed")
                continue;

            if (controller.Equals("ServiceType", StringComparison.OrdinalIgnoreCase))
            {
                var parsed = ParseServiceSeed(description, addition);
                if (parsed is not null)
                    services.Add(parsed);
            }
            else if (controller.Equals("InsuranceCompany", StringComparison.OrdinalIgnoreCase))
            {
                var parsed = ParseInsuranceSeed(description, addition);
                if (parsed is not null)
                    insurances.Add(parsed);
            }
        }

        return (services, insurances);
    }

    private static ServiceSeedRow? ParseServiceSeed(string title, string addition)
    {
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(addition))
            return null;

        var map = ParseKeyValue(addition);
        if (!map.TryGetValue("Code", out var code) || !map.TryGetValue("Category", out var categoryName))
            return null;

        if (!Enum.TryParse<CategoryTypeId>(categoryName, ignoreCase: true, out var category))
            return null;

        _ = long.TryParse(map.GetValueOrDefault("Price"), out var price);
        var desc = map.GetValueOrDefault("Description") ?? title;

        return new ServiceSeedRow(title.Trim(), code.Trim(), category, price, desc.Trim());
    }

    private static InsuranceSeedRow? ParseInsuranceSeed(string name, string addition)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(addition))
            return null;

        var map = ParseKeyValue(addition);
        if (!map.TryGetValue("Code", out var code) || !map.TryGetValue("InsuranceType", out var typeName))
            return null;

        if (!Enum.TryParse<InsuranceTypeId>(typeName, ignoreCase: true, out var insuranceType))
            return null;

        return new InsuranceSeedRow(name.Trim(), code.Trim(), insuranceType);
    }

    private static Dictionary<string, string> ParseKeyValue(string addition)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var part in addition.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var idx = part.IndexOf('=');
            if (idx <= 0)
                continue;

            var key = part[..idx].Trim();
            if (key.Equals("Seed", StringComparison.OrdinalIgnoreCase))
                continue;

            result[key] = part[(idx + 1)..].Trim();
        }

        return result;
    }

    private static string? GetCellValue(IReadOnlyList<Cell> cells, SharedStringTable? sharedStrings, string column, uint? rowIndex)
    {
        var cellReference = $"{column}{rowIndex}";
        var cell = cells.FirstOrDefault(c =>
            string.Equals(c.CellReference?.Value, cellReference, StringComparison.OrdinalIgnoreCase));

        // بعضی فایل‌های اکسل سلول‌ها را بدون CellReference ذخیره می‌کنند
        if (cell is null && int.TryParse(column, out var colIndex))
        {
            cell = colIndex <= cells.Count ? cells[colIndex - 1] : null;
        }

        if (cell is null)
            return null;

        if (cell.DataType?.Value == CellValues.SharedString && sharedStrings is not null && cell.CellValue?.Text is not null)
        {
            if (int.TryParse(cell.CellValue.Text, out var index) && index < sharedStrings.Count())
                return sharedStrings.ElementAt(index).InnerText;
        }

        return cell.CellValue?.Text ?? cell.InnerText;
    }
}
