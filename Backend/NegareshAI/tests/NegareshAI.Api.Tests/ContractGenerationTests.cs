using System.Text.Json;
using NegareshAI.Api.Application.Contracts.Generation;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class ContractGenerationTests
{
    [Fact]
    public void Parses_slash_grouped_amount_without_confusing_persian_dates()
    {
        var contract = new Contract { Subject = "پشتیبانی", Currency = "IRR" };

        var result = ContractChangeSetParser.Parse(
            "قرارداد پشتیبانی شرکت فسا از تاریخ 1402/01/01 تا 1402/12/29 و با مبلغ 6/000/000/000 ریال",
            contract);

        Assert.Equal(6_000_000_000m, result.CalculatedAmount);
        Assert.Equal(new DateOnly(2023, 3, 21), result.StartDate);
        Assert.Equal(new DateOnly(2024, 3, 19), result.EndDate);
        Assert.Empty(result.Questions);
    }

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

    [Fact]
    public void Conflicting_explicit_amount_and_percentage_requires_user_decision()
    {
        var contract = new Contract
        {
            OrganizationId = Guid.NewGuid(), DocumentId = Guid.NewGuid(), Subject = "پشتیبانی",
            Amount = 100_000_000m, StartDate = new DateOnly(2025, 3, 21),
            EndDate = new DateOnly(2026, 3, 20)
        };

        var result = ContractChangeSetParser.Parse(
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۲۰ درصد افزایش و به ۱۳۰۰۰۰۰۰۰ ریال تغییر کند", contract);

        Assert.Contains(result.Questions, question => question.Contains("متفاوت است"));
    }

    [Fact]
    public async Task Effective_template_prefers_exact_contract_year_then_highest_version()
    {
        await using var db = new NegareshDbContext(new DbContextOptionsBuilder<NegareshDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var organizationId = Guid.NewGuid();
        var groupId = Guid.NewGuid();
        db.ContractTemplates.AddRange(
            Template(organizationId, groupId, null, 9),
            Template(organizationId, groupId, 1405, 1),
            Template(organizationId, groupId, 1405, 2),
            Template(organizationId, groupId, 1404, 20));
        await db.SaveChangesAsync();
        var handler = new GetEffectiveContractTemplateHandler(db,
            new StubTenant(organizationId, "user-1"));

        var result = await handler.Handle(new(groupId, new DateOnly(2026, 3, 21)), default);

        Assert.NotNull(result.Template);
        Assert.Equal(1405, result.Template.ContractYear);
        Assert.Equal(2, result.Template.Version);
    }

    private static ContractTemplate Template(Guid organizationId, Guid groupId, int? year, int version) => new()
    {
        OrganizationId = organizationId, ContractGroupId = groupId, ContractYear = year,
        Name = $"template-{year}-{version}", ContractType = "service", FileId = "file",
        Version = version, IsActive = true
    };

    private sealed record StubTenant(Guid OrganizationId, string UserId) : ICurrentTenant;
}
