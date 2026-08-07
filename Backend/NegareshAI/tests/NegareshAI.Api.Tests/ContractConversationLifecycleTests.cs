using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Contracts.Generation;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class ContractConversationLifecycleTests
{
    [Fact]
    public async Task Intent_only_fasa_request_resolves_everything_and_increments_clause_count()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var contract = await db.Contracts.Include(x => x.Clauses).SingleAsync();
        for (var index = 1; index <= 10; index++)
            db.ContractClauses.Add(new ContractClause
            {
                ContractId = contract.Id, ClauseNumber = index.ToString(),
                Title = $"بند {index}", Text = $"متن بند {index}"
            });
        await db.SaveChangesAsync();
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());

        var result = await handler.Handle(new StartContractConversationCommand(new(
            null, null, null, null,
            "قرارداد شرکت فسا برای تاریخ ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ به مبلغ ۲۲۵۰۰۰۰۰۰۰۰ ریال تمدید شود و بند پیگیری شکایت از دیوان عدالت اداری به آن اضافه شود.")), default);

        Assert.NotNull(result);
        Assert.Equal(seed.PartyId, result.OrganizationPartyId);
        Assert.Equal(seed.GroupId, result.PrimaryContractGroupId);
        Assert.Equal(1405, result.ContractYear);
        var draft = Assert.Single(result.Drafts);
        using var diff = JsonDocument.Parse(draft.DiffJson);
        Assert.Equal(22_500_000_000m, diff.RootElement.GetProperty("Amount").GetProperty("After").GetDecimal());
        Assert.Equal("پیگیری شکایت از دیوان عدالت اداری", diff.RootElement.GetProperty("AddedClause").GetString());
        Assert.Equal(10, diff.RootElement.GetProperty("ClauseCount").GetProperty("Before").GetInt32());
        Assert.Equal(11, diff.RootElement.GetProperty("ClauseCount").GetProperty("After").GetInt32());
    }

    [Fact]
    public async Task Generation_reads_first_party_only_from_organization_profile()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var generator = new RecordingGenerator();
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            generator, new HttpContextAccessor(), new NullAudit());

        var result = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی شرکت فسا",
            "شرکت ما اشتباه است؛ از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد")), default);

        Assert.NotNull(result);
        Assert.Equal("شرکت داده پردازان", generator.Values["organizationName"]);
        Assert.Equal("مصطفی مهدوی", generator.Values["organizationRepresentative"]);
        Assert.Equal("ابراهیم", generator.Values["organizationFatherName"]);
        Assert.Equal("0012345678", generator.Values["organizationRepresentativeNationalIdentifier"]);
        Assert.Equal("14001234567", generator.Values["organizationNationalIdentifier"]);
        Assert.Equal("411111111111", generator.Values["organizationEconomicCode"]);
        Assert.Equal("02188776655", generator.Values["organizationPhone"]);
        Assert.Equal("شرکت داده پردازان", generator.Values["نام شرکت"]);
        Assert.Equal("14001234567", generator.Values["شناسه ملی شرکت"]);
        Assert.Contains("OrganizationProfile", Assert.Single(result.Drafts).SourceSnapshotJson);
    }

    [Fact]
    public async Task Explicit_request_date_year_wins_over_year_inside_contract_number()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());

        var result = await handler.Handle(new StartContractConversationCommand(new(
            null, null, null, null,
            "قرارداد شرکت فسا بر اساس قرارداد 1403-2232154 با تاریخ 1405/01/01 و مبلغ ۲۲۵۰۰۰۰۰۰۰۰ ریال تنظیم شود")), default);

        Assert.NotNull(result);
        Assert.Equal(1405, result.ContractYear);
    }

    [Fact]
    public void Parser_understands_required_clause_in_natural_persian()
    {
        var parsed = ContractChangeSetParser.Parse(
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۲۲۵۰۰۰۰۰۰۰۰ ریال باشد و بند پیگیری شکایت از دیوان عدالت اداری باید باشه",
            new Contract { OrganizationId = Guid.NewGuid(), DocumentId = Guid.NewGuid(), Subject = "پشتیبانی" });

        Assert.Empty(parsed.Questions);
        Assert.Equal("پیگیری شکایت از دیوان عدالت اداری", parsed.NewClause);
        Assert.Equal(22_500_000_000m, parsed.CalculatedAmount);
    }

    [Fact]
    public void Parser_requests_new_end_date_and_extracts_quoted_article()
    {
        var parsed = ContractChangeSetParser.Parse(
            "قرارداد بر اساس قرارداد 1403-2232154 با تاریخ 1405/01/01 و افزایش 25 درصد تنظیم کن و ماده جدید اضافه کن که \"کلیه دعاوی و اختلافات از طریق دعوای فیزیکی قابل دریافت است\".",
            new Contract
            {
                OrganizationId = Guid.NewGuid(), DocumentId = Guid.NewGuid(), Subject = "پشتیبانی",
                Amount = 100m, StartDate = new DateOnly(2024, 3, 20), EndDate = new DateOnly(2025, 3, 20)
            });

        Assert.Contains(parsed.Questions, question => question.Contains("تاریخ پایان قرارداد جدید"));
        Assert.Equal("کلیه دعاوی و اختلافات از طریق دعوای فیزیکی قابل دریافت است", parsed.NewClause);
        Assert.Equal(125m, parsed.CalculatedAmount);
    }

    [Fact]
    public void Parser_reports_invalid_jalali_date_instead_of_date_order_conflict()
    {
        var parsed = ContractChangeSetParser.Parse(
            "تاریخ شروع 1405/01/01 و تاریخ پایان 1405/32/19 است",
            new Contract
            {
                OrganizationId = Guid.NewGuid(), DocumentId = Guid.NewGuid(), Subject = "پشتیبانی",
                Amount = 100m, StartDate = new DateOnly(2024, 3, 20), EndDate = new DateOnly(2025, 3, 20)
            });

        Assert.Contains(parsed.Questions, question => question.Contains("شمسی معتبر نیست"));
    }

    [Theory]
    [InlineData("1405/12/29")]
    [InlineData("1405/29/12")]
    [InlineData("29/12/1405")]
    [InlineData("1405-12-29")]
    [InlineData("1405.29.12")]
    [InlineData("29 اسفند 1405")]
    [InlineData("1405 اسفند 29")]
    public void Parser_accepts_common_persian_date_orders(string endDate)
    {
        var parsed = ContractChangeSetParser.Parse(
            $"تاریخ شروع 1405/01/01 و تاریخ پایان {endDate} و مبلغ 1000000 ریال است",
            new Contract { OrganizationId = Guid.NewGuid(), DocumentId = Guid.NewGuid(), Subject = "پشتیبانی" });

        Assert.Empty(parsed.Questions);
        Assert.Equal(new DateOnly(2027, 3, 20), parsed.EndDate);
    }

    [Fact]
    public void Parser_keeps_contract_dates_and_extracts_payment_schedule_and_multiple_articles()
    {
        var parsed = ContractChangeSetParser.Parse(
            "قرارداد از 1405/01/01 تا 1405/12/29 با افزایش 36 درصد تنظیم شود و ماده جدید اضافه کن که \"کلیه دعاوی و اختلافات از طریق دعوای فیزیکی قابل دریافت است\".\n" +
            "پرداخت اول 1405/01/01 و پرداخت دوم 1405/06/01؛ ماده \"کلیه اسناد باید محرمانه باشه\" هم اضافه شه",
            new Contract
            {
                OrganizationId = Guid.NewGuid(), DocumentId = Guid.NewGuid(), Subject = "پشتیبانی",
                Amount = 100m, StartDate = new DateOnly(2025, 3, 21), EndDate = new DateOnly(2026, 3, 20)
            });

        Assert.Empty(parsed.Questions);
        Assert.Equal(new DateOnly(2026, 3, 21), parsed.StartDate);
        Assert.Equal(new DateOnly(2027, 3, 20), parsed.EndDate);
        Assert.Equal(new DateOnly(2026, 3, 21), parsed.FirstPaymentDate);
        Assert.Equal(new DateOnly(2026, 8, 23), parsed.SecondPaymentDate);
        Assert.Equal(136m, parsed.CalculatedAmount);
        Assert.Equal(2, parsed.NewClauses?.Count);
        Assert.Contains("کلیه دعاوی و اختلافات از طریق دعوای فیزیکی قابل دریافت است", parsed.NewClauses!);
        Assert.Contains("کلیه اسناد باید محرمانه باشه", parsed.NewClauses!);
    }

    [Fact]
    public async Task Effective_template_is_selected_by_requested_start_date()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        var expected = new ContractTemplate
        {
            OrganizationId = seed.Tenant.OrganizationId, ContractGroupId = seed.GroupId,
            ContractYear = 1405, Name = "قالب مؤثر ابتدای سال", ContractType = "service",
            FileId = "template-effective", Version = 3,
            EffectiveFrom = new DateOnly(2026, 3, 21), EffectiveTo = new DateOnly(2026, 3, 31)
        };
        db.ContractTemplates.Add(expected);
        db.ContractTemplates.Add(new ContractTemplate
        {
            OrganizationId = seed.Tenant.OrganizationId, ContractGroupId = seed.GroupId,
            ContractYear = 1405, Name = "قالب مؤثر آینده", ContractType = "service",
            FileId = "template-future", Version = 9, EffectiveFrom = new DateOnly(2026, 4, 1)
        });
        await db.SaveChangesAsync();
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());

        var result = await handler.Handle(new StartContractConversationCommand(new(
            null, null, null, null,
            "قرارداد شرکت فسا از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ به مبلغ ۲۲۵۰۰۰۰۰۰۰۰ ریال تمدید شود")), default);

        Assert.NotNull(result);
        Assert.Equal(expected.Id, Assert.Single(result.Drafts).ContractTemplateId);
    }

    [Fact]
    public async Task Correction_creates_immutable_next_draft_from_highest_final_reference()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var files = new MemoryFiles();
        var handler = new StartContractConversationHandler(db, seed.Tenant, files,
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());

        var first = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی نرم‌افزار",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد")), default);

        Assert.NotNull(first);
        Assert.Single(first.Drafts);
        Assert.Equal(seed.FinalVersionId, first.Drafts[0].BaseDocumentVersionId);
        Assert.Contains("Final", first.Drafts[0].SourceSnapshotJson);

        var second = await handler.Handle(new SendContractConversationMessageCommand(first.Id,
            "بند آموزش کاربران توسط پیمانکار اضافه کن"), default);

        Assert.NotNull(second);
        Assert.Equal(2, second.Drafts.Count);
        Assert.Equal(2, second.Drafts[0].VersionNumber);
        Assert.NotEqual(second.Drafts[0].Id, second.Drafts[1].Id);
        Assert.Equal(1, second.Drafts[1].VersionNumber);
    }

    [Fact]
    public async Task Rejected_draft_applies_payment_dates_and_another_article_to_next_version()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var files = new MemoryFiles();
        var generator = new RecordingGenerator();
        var conversationHandler = new StartContractConversationHandler(db, seed.Tenant, files,
            generator, new HttpContextAccessor(), new NullAudit());
        var first = (await conversationHandler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی شرکت فسا",
            "از 1405/01/01 تا 1405/12/29 با افزایش 36 درصد تنظیم کن و ماده جدید اضافه کن که \"کلیه دعاوی و اختلافات از طریق دعوای فیزیکی قابل دریافت است\"")), default))!;

        var firstDraft = Assert.Single(first.Drafts);
        var reviewHandler = new ReviewContractDraftHandler(db, seed.Tenant, new NullAudit(), files,
            new HttpContextAccessor());
        await reviewHandler.Handle(new ReviewContractDraftCommand(first.Id, firstDraft.Id,
            ContractDraftApprovalStatus.RequesterReview, new(false, "نیاز به اصلاح")), default);

        var corrected = await conversationHandler.Handle(new SendContractConversationMessageCommand(first.Id,
            "پرداخت اول 1405/01/01 و پرداخت دوم 1405/06/01؛ ماده \"کلیه اسناد باید محرمانه باشه\" هم اضافه شه"), default);

        Assert.NotNull(corrected);
        Assert.Equal(2, corrected.Drafts.Count);
        var latest = corrected.Drafts[0];
        Assert.Equal(2, latest.VersionNumber);
        var changes = JsonSerializer.Deserialize<ContractChangeSet>(latest.ChangeSetJson)!;
        Assert.Equal(2, changes.NewClauses?.Count);
        Assert.Equal(new DateOnly(2026, 3, 21), changes.FirstPaymentDate);
        Assert.Equal(new DateOnly(2026, 8, 23), changes.SecondPaymentDate);
        var generatedClauses = JsonSerializer.Deserialize<string[]>(generator.Values["newClausesJson"]);
        Assert.Contains("کلیه اسناد باید محرمانه باشه", generatedClauses!);
        Assert.Equal("۱۴۰۵/۰۱/۰۱", generator.Values["firstPaymentDate"]);
        Assert.Equal("۱۴۰۵/۰۶/۰۱", generator.Values["secondPaymentDate"]);
        using var diff = JsonDocument.Parse(latest.DiffJson);
        Assert.Equal(2, diff.RootElement.GetProperty("AddedClauses").GetArrayLength());
    }

    [Fact]
    public async Task Rag_publication_happens_only_after_requester_expert_and_manager_approvals()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var files = new MemoryFiles();
        var starter = new StartContractConversationHandler(db, seed.Tenant, files,
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());
        var conversation = (await starter.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد")), default))!;
        var ai = new RecordingAi();
        var review = new ReviewContractDraftHandler(db, seed.Tenant, new NullAudit(), files,
            new HttpContextAccessor(), ai);
        var draftId = conversation.Drafts[0].Id;

        await review.Handle(new(conversation.Id, draftId, ContractDraftApprovalStatus.RequesterReview,
            new(true, null)), default);
        await review.Handle(new(conversation.Id, draftId, ContractDraftApprovalStatus.ExpertReview,
            new(true, null)), default);
        Assert.Equal(0, ai.PublishCount);

        var final = await review.Handle(new(conversation.Id, draftId,
            ContractDraftApprovalStatus.ManagerReview, new(true, "نهایی")), default);

        Assert.NotNull(final);
        Assert.Equal(1, ai.PublishCount);
        Assert.Equal(ContractDraftApprovalStatus.Final, final.Drafts[0].ApprovalStatus);
        Assert.NotNull(final.Drafts[0].FinalDocumentVersionId);
        Assert.Equal(1, ai.DeleteCount);
        Assert.Equal(DocumentVersionLifecycleStatus.Final,
            await db.DocumentVersions.Where(x => x.Id == final.Drafts[0].FinalDocumentVersionId)
                .Select(x => x.LifecycleStatus).SingleAsync());
    }

    [Fact]
    public async Task Manager_finalization_persists_new_clauses_and_first_party()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var files = new MemoryFiles();
        var starter = new StartContractConversationHandler(db, seed.Tenant, files,
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());
        var conversation = (await starter.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی فسا",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد و ماده \"کلیه اسناد باید محرمانه باشد\" اضافه شود")), default))!;
        var review = new ReviewContractDraftHandler(db, seed.Tenant, new NullAudit(), files,
            new HttpContextAccessor(), new RecordingAi());
        var draftId = conversation.Drafts[0].Id;

        await review.Handle(new(conversation.Id, draftId, ContractDraftApprovalStatus.RequesterReview,
            new(true, null)), default);
        await review.Handle(new(conversation.Id, draftId, ContractDraftApprovalStatus.ExpertReview,
            new(true, null)), default);
        var final = await review.Handle(new(conversation.Id, draftId,
            ContractDraftApprovalStatus.ManagerReview, new(true, "نهایی")), default);

        Assert.NotNull(final);
        var contractId = final.BaseContractId!.Value;
        Assert.Equal("پشتیبانی فسا", final.Subject);
        Assert.Equal("پشتیبانی فسا",
            await db.Contracts.Where(x => x.Id == contractId).Select(x => x.Subject).SingleAsync());
        Assert.Contains(await db.ContractClauses.Where(x => x.ContractId == contractId)
            .Select(x => x.Text).ToListAsync(), x => x == "کلیه اسناد باید محرمانه باشد");
        Assert.Single(await db.ContractParties.Where(x => x.ContractId == contractId
            && x.Role == ContractPartyRole.FirstParty).ToListAsync());

        var revised = await starter.Handle(new SendContractConversationMessageCommand(conversation.Id,
            "موضوع قرارداد «پشتیبانی شرکت فسا» باشد"), default);

        Assert.NotNull(revised);
        Assert.Equal("پشتیبانی شرکت فسا", revised.Subject);
        Assert.Equal(2, revised.Drafts[0].VersionNumber);
        Assert.Equal(ContractDraftApprovalStatus.RequesterReview, revised.Drafts[0].ApprovalStatus);
    }

    [Fact]
    public async Task Greenfield_generation_snapshots_approved_group_clause_catalog()
    {
        await using var db = CreateDb();
        var seed = Seed(db, includeBase: false);
        db.ApprovedContractClauses.Add(new ApprovedContractClause
        {
            OrganizationId = seed.Tenant.OrganizationId, ContractGroupId = seed.GroupId,
            Code = "DISPUTE-01", Title = "حل اختلاف", Text = "مرجع حل اختلاف شورای سازمان است.",
            Order = 1, IsRequired = true, CreatedByUserId = seed.Tenant.UserId
        });
        await db.SaveChangesAsync();
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());

        var result = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "نگهداری ماشین‌آلات",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۲۶۵۰۰۰۰۰۰۰۰۰ ریال باشد")), default);

        Assert.NotNull(result);
        Assert.Single(result.Drafts);
        Assert.Null(result.BaseContractId);
        Assert.Contains("DISPUTE-01", result.Drafts[0].SourceSnapshotJson);
        Assert.False(string.IsNullOrWhiteSpace(result.Drafts[0].GeneratedPdfFileId));
    }

    [Fact]
    public async Task Fasa_renewal_resolves_amount_conflict_and_snapshots_final_rag_citation()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var ai = new RecordingAi
        {
            SearchResults = [new AiRagSearchResult("مبلغ و شرایط قرارداد پشتیبانی فسا",
                .97, new AiRagCitation(seed.DocumentId, seed.FinalVersionId, 4, "مبلغ قرارداد"))]
        };
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit(), ai);

        var first = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی شرکت فسا",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۲۵ درصد افزایش و مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد")), default);

        Assert.NotNull(first);
        Assert.Empty(first.Drafts);
        Assert.Contains(first.Clarifications, x => !x.IsAnswered && x.Question.Contains("متفاوت است"));

        var resolved = await handler.Handle(new SendContractConversationMessageCommand(first.Id,
            "مبلغ قطعی اعلام‌شده مبنا باشد"), default);

        Assert.NotNull(resolved);
        Assert.Single(resolved.Drafts);
        Assert.Contains(seed.FinalVersionId.ToString(), resolved.Drafts[0].SourceSnapshotJson);
        Assert.Contains("\"Page\":4", resolved.Drafts[0].SourceSnapshotJson);
        Assert.False(string.IsNullOrWhiteSpace(resolved.Drafts[0].GeneratedPdfFileId));
        Assert.Equal(1, ai.SearchCount);
    }

    [Fact]
    public async Task Natural_request_creates_counterparty_and_resolves_contract_group()
    {
        await using var db = CreateDb();
        var seed = Seed(db, includeBase: false);
        db.OrganizationParties.Remove(db.OrganizationParties.Local.Single());
        await db.SaveChangesAsync();
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());

        var result = await handler.Handle(new StartContractConversationCommand(new(null, null, null, null,
            "قرارداد پشتیبانی با شرکت فناوری داده ای از تاریخ 1405/01/01 تا 1405/12/29 با مبلغ 255/000/000/000 ریال ثبت کن. نماینده شرکت آقای محمد حسین علوی باشه و شماره ملی 22365411 و آدرس تهران، یوسف آباد پلاک 56")), default);

        Assert.NotNull(result);
        Assert.Equal(seed.GroupId, result.PrimaryContractGroupId);
        Assert.Equal("پشتیبانی", result.Subject);
        var party = await db.OrganizationParties.SingleAsync();
        Assert.Equal("فناوری داده ای", party.Name);
        Assert.Equal("محمد حسین علوی", party.RepresentativeName);
        Assert.Equal("22365411", party.NationalIdentifier);
        Assert.Equal("تهران، یوسف آباد پلاک 56", party.Address);
        Assert.Single(result.Drafts);
    }

    [Fact]
    public async Task Rag_http_failure_does_not_fail_the_contract_request()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var ai = new RecordingAi { SearchException = new HttpRequestException("AI search unavailable") };
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit(), ai);

        var result = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی شرکت فسا",
            "قرارداد جدید برای پشتیبانی شرکت فسا را بر اساس قرارداد 1403-2232154 با تاریخ 1405/01/01 تا 29 اسفند 1405 و افزایش 36 درصد تنظیم کن و ماده جدید اضافه کن که \"کلیه دعاوی و اختلافات از طریق دعوای فیزیکی قابل دریافت است\".")), default);

        Assert.NotNull(result);
        Assert.Equal("پشتیبانی شرکت فسا", result.Subject);
        Assert.Equal(1, ai.SearchCount);
        Assert.True(result.Drafts.Count > 0 || result.Clarifications.Count > 0);
    }

    [Fact]
    public async Task Dispute_clause_conflict_requires_explicit_replacement_decision()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var ai = new RecordingAi
        {
            SearchResults = [new AiRagSearchResult(
                "حل اختلاف قرارداد قبلی از طریق داوری انجام می‌شود.", .92,
                new AiRagCitation(seed.DocumentId, seed.FinalVersionId, 7, "حل اختلاف"))]
        };
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit(), ai);

        var first = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد و بند حل اختلاف شورای سازمان را اضافه کن")), default);

        Assert.NotNull(first);
        Assert.Empty(first.Drafts);
        Assert.Contains(first.Clarifications, x => x.Key.Contains("DISPUTE_CONFLICT"));

        var resolved = await handler.Handle(new SendContractConversationMessageCommand(first.Id,
            "بند جدید جایگزین بند قبلی شود"), default);

        Assert.NotNull(resolved);
        Assert.Single(resolved.Drafts);
        Assert.Contains("DISPUTE_CONFLICT", resolved.Drafts[0].ConflictAnalysisJson);
    }

    [Fact]
    public async Task Cross_group_rag_source_is_used_only_when_explicitly_selected()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        var otherGroup = new ContractGroup { OrganizationId = seed.Tenant.OrganizationId,
            Name = "نگهداری", CreatedByUserId = seed.Tenant.UserId };
        var otherDocument = new Document { OrganizationId = seed.Tenant.OrganizationId,
            Title = "قرارداد نگهداری مرجع", DocumentType = "Contract" };
        otherDocument.Versions.Add(new DocumentVersion { DocumentId = otherDocument.Id,
            VersionNumber = 1, FileId = "other", LifecycleStatus = DocumentVersionLifecycleStatus.Final,
            IsRagPublished = true, ExtractedText = "شرایط نگهداری" });
        var otherContract = new Contract { OrganizationId = seed.Tenant.OrganizationId,
            Document = otherDocument, Subject = "نگهداری", PrimaryContractGroup = otherGroup,
            StartDate = new DateOnly(2025, 3, 21), EndDate = new DateOnly(2026, 3, 20) };
        otherContract.GroupMemberships.Add(new ContractGroupMembership
            { ContractGroup = otherGroup, IsPrimary = true });
        db.Contracts.Add(otherContract);
        await db.SaveChangesAsync();
        var ai = new RecordingAi();
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit(), ai);

        var result = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد",
            [otherContract.Id])), default);

        Assert.NotNull(result);
        Assert.Contains(otherDocument.Id, ai.LastDocumentIds);
        Assert.Contains(otherContract.Id.ToString(), result.Drafts[0].SourceSnapshotJson);

        var denied = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit(), null,
            new SelectiveAuthorizer(seed.GroupId));
        var deniedResult = await denied.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی دوم",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد",
            [otherContract.Id])), default);
        Assert.Null(deniedResult);
    }

    private static SeedResult Seed(NegareshDbContext db, bool includeBase = true)
    {
        var organizationId = Guid.NewGuid();
        var tenant = new StubTenant(organizationId, "user-1");
        db.Organizations.Add(new Organization
        {
            Id = organizationId,
            Name = "شرکت داده پردازان",
            ChiefExecutiveName = "مصطفی مهدوی",
            ChiefExecutiveFatherName = "ابراهیم",
            ChiefExecutiveNationalId = "0012345678",
            NationalIdentifier = "14001234567",
            EconomicCode = "411111111111",
            Address = "تهران، خیابان نمونه، پلاک ۱",
            Phone = "02188776655"
        });
        var party = new OrganizationParty { OrganizationId = organizationId, Name = "شرکت فسا" };
        var group = new ContractGroup { OrganizationId = organizationId, Name = "پشتیبانی", CreatedByUserId = tenant.UserId };
        var document = new Document { OrganizationId = organizationId, Title = "قرارداد ۱۴۰۴", DocumentType = "Contract" };
        var final = new DocumentVersion { DocumentId = document.Id, VersionNumber = 3,
            FileId = "base-final", LifecycleStatus = DocumentVersionLifecycleStatus.Final,
            IsRagPublished = true, ExtractedText = "حل اختلاف قرارداد قبلی از طریق داوری انجام می‌شود." };
        document.Versions.Add(final);
        var contract = new Contract
        {
            OrganizationId = organizationId, Document = document, Subject = "پشتیبانی",
            Amount = 100_000_000m, StartDate = new DateOnly(2025, 3, 21),
            EndDate = new DateOnly(2026, 3, 20), PrimaryContractGroup = group
        };
        contract.Parties.Add(new ContractParty { DirectoryParty = party, Name = party.Name, Role = ContractPartyRole.SecondParty });
        contract.GroupMemberships.Add(new ContractGroupMembership { ContractGroup = group, IsPrimary = true });
        db.ContractTemplates.Add(new ContractTemplate
        {
            OrganizationId = organizationId, ContractGroup = group, ContractYear = 1405,
            Name = "قالب پشتیبانی", ContractType = "service", FileId = "template", Version = 2
        });
        db.RuntimeSettings.Add(new RuntimeSetting { OrganizationId = organizationId, Category = "ai", Key = "embedding.model", ValueJson = "{\"modelId\":\"BAAI/bge-m3\"}" });
        if (includeBase) db.Contracts.Add(contract);
        else
        {
            db.OrganizationParties.Add(party);
            db.ContractGroups.Add(group);
        }
        return new(tenant, party.Id, group.Id, document.Id, final.Id);
    }

    private static NegareshDbContext CreateDb() => new(new DbContextOptionsBuilder<NegareshDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private sealed record SeedResult(StubTenant Tenant, Guid PartyId, Guid GroupId,
        Guid DocumentId, Guid FinalVersionId);
    private sealed record StubTenant(Guid OrganizationId, string UserId) : ICurrentTenant;
    private sealed class SelectiveAuthorizer(Guid allowedGroupId) : IDataScopeAuthorizer
    {
        public Task<bool> CanAccessAsync(DataScopeResourceType resourceType, Guid resourceId,
            CancellationToken cancellationToken = default) => Task.FromResult(resourceId == allowedGroupId);
        public Task<IReadOnlySet<Guid>?> GetAllowedResourceIdsAsync(DataScopeResourceType resourceType,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlySet<Guid>?>(new HashSet<Guid> { allowedGroupId });
    }
    private sealed class NullAudit : IAuditWriter { public void Add(string action, string entityType, string? entityId, object? metadata = null) { } }
    private sealed class PassThroughGenerator : IContractDocumentGenerator
    {
        public Task<byte[]> GenerateAsync(byte[] template, IReadOnlyDictionary<string, string> values, CancellationToken ct) => Task.FromResult<byte[]>([1, 2, 3]);
        public Task<byte[]> GeneratePdfAsync(ContractPdfRequest request, CancellationToken ct) =>
            Task.FromResult<byte[]>([0x25, 0x50, 0x44, 0x46]);
    }
    private sealed class RecordingGenerator : IContractDocumentGenerator
    {
        public IReadOnlyDictionary<string, string> Values { get; private set; } =
            new Dictionary<string, string>();
        public Task<byte[]> GenerateAsync(byte[] template, IReadOnlyDictionary<string, string> values,
            CancellationToken ct)
        {
            Values = new Dictionary<string, string>(values);
            return Task.FromResult<byte[]>([1, 2, 3]);
        }
        public Task<byte[]> GeneratePdfAsync(ContractPdfRequest request, CancellationToken ct) =>
            Task.FromResult<byte[]>([0x25, 0x50, 0x44, 0x46]);
    }
    private sealed class MemoryFiles : IFileManagerClient
    {
        private int count;
        public Task<string> UploadAsync(Stream content, string fileName, string contentType, string? bearerToken, CancellationToken ct) => Task.FromResult($"generated-{++count}");
        public Task<FileManagerDownload> DownloadAsync(string fileId, string? bearerToken, CancellationToken ct) => Task.FromResult(new FileManagerDownload([1, 2, 3], $"{fileId}.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    }
    private sealed class RecordingAi : IAiDocumentProcessor
    {
        public int PublishCount { get; private set; }
        public int SearchCount { get; private set; }
        public int DeleteCount { get; private set; }
        public IReadOnlyList<AiRagSearchResult> SearchResults { get; init; } = [];
        public Exception? SearchException { get; init; }
        public IReadOnlyCollection<Guid> LastDocumentIds { get; private set; } = [];
        public Task<AiProcessingResult> ProcessAsync(Guid organizationId, Guid documentId, Guid versionId, string fileName, byte[] content, string embeddingModel, string accessScope, IReadOnlyCollection<string> allowedUserIds, IReadOnlyCollection<string> allowedGroupIds, bool publishToRag, CancellationToken ct) => Task.FromResult(new AiProcessingResult("extracted", 1, 10, 0, 0, "متن نهایی"));
        public Task<int> PublishTextAsync(Guid organizationId, Guid documentId, Guid versionId, string extractedText, string embeddingModel, string accessScope, IReadOnlyCollection<string> allowedUserIds, IReadOnlyCollection<string> allowedGroupIds, CancellationToken ct) { PublishCount++; return Task.FromResult(1); }
        public Task DeleteVersionAsync(Guid organizationId, Guid documentId, Guid versionId, string embeddingModel, CancellationToken ct)
        { DeleteCount++; return Task.CompletedTask; }
        public Task<IReadOnlyList<AiRagSearchResult>> SearchAsync(Guid organizationId,
            string userId, IReadOnlyCollection<string> groupIds, string query,
            IReadOnlyCollection<Guid> documentIds, string embeddingModel, int limit,
            CancellationToken ct)
        {
            SearchCount++;
            LastDocumentIds = documentIds;
            return SearchException is null
                ? Task.FromResult(SearchResults)
                : Task.FromException<IReadOnlyList<AiRagSearchResult>>(SearchException);
        }
    }
}
