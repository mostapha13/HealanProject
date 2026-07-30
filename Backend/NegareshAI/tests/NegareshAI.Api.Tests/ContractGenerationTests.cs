using System.Text.Json;
using NegareshAI.Api.Application.Contracts.Generation;
using NegareshAI.Api.Data;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class ContractGenerationTests
{
    [Fact]
    public void Persian_instruction_produces_deterministic_dates_percentage_and_amount()
    {
        var contract = new Contract
        {
            OrganizationId = Guid.NewGuid(), DocumentId = Guid.NewGuid(),
            Subject = "پشتیبانی", Amount = 12_000_000_000m,
            StartDate = new DateOnly(2025, 3, 21), EndDate = new DateOnly(2026, 3, 20)
        };

        var result = ContractChangeSetParser.Parse(
            "از تاریخ ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ با افزایش ۲۵ درصد تمدید کن و بند حل اختلاف را اضافه کن",
            contract);

        Assert.Equal(new DateOnly(2026, 3, 21), result.StartDate);
        Assert.Equal(new DateOnly(2027, 3, 20), result.EndDate);
        Assert.Equal(25m, result.IncreasePercent);
        Assert.Equal(15_000_000_000m, result.CalculatedAmount);
        Assert.Empty(result.Questions);
        Assert.Contains("حل اختلاف", result.NewClause);
    }

    [Fact]
    public void Missing_legal_or_financial_values_returns_questions_instead_of_guessing()
    {
        var contract = new Contract
        {
            OrganizationId = Guid.NewGuid(), DocumentId = Guid.NewGuid(),
            Subject = "پشتیبانی"
        };

        var result = ContractChangeSetParser.Parse("قرارداد را تمدید کن", contract);

        Assert.Null(result.CalculatedAmount);
        Assert.True(result.Questions.Count >= 2);
        Assert.Contains(result.Questions, question => question.Contains("مبلغ"));
    }
}
