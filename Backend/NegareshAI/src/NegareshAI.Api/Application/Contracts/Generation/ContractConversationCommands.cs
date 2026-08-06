using System.Globalization;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Dates;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;

namespace NegareshAI.Api.Application.Contracts.Generation;

public sealed record StartContractConversationCommand(StartContractConversationRequest Request)
    : IRequest<ContractConversationResponse?>;
public sealed record SendContractConversationMessageCommand(Guid Id, string Message)
    : IRequest<ContractConversationResponse?>;
public sealed record GetContractConversationQuery(Guid Id) : IRequest<ContractConversationResponse?>;
public sealed record ListContractConversationsQuery : IRequest<IReadOnlyList<ContractConversationListItemResponse>>;
public sealed record ListContractSourceOptionsQuery : IRequest<IReadOnlyList<ContractSourceOptionResponse>>;
public sealed record DownloadContractDraftQuery(Guid ConversationId, Guid DraftId, string Format)
    : IRequest<ContractDraftDownload?>;
public sealed record ContractDraftDownload(byte[] Content, string FileName, string ContentType);
public sealed record ReviewContractDraftCommand(Guid ConversationId, Guid DraftId,
    ContractDraftApprovalStatus ExpectedStatus, ReviewContractDraftRequest Request)
    : IRequest<ContractConversationResponse?>;

public sealed class StartContractConversationHandler(
    NegareshDbContext db, ICurrentTenant tenant, IFileManagerClient files,
    IContractDocumentGenerator generator, IHttpContextAccessor context, IAuditWriter audit,
    IAiDocumentProcessor? ai = null,
    IDataScopeAuthorizer? authorizer = null,
    ILogger<StartContractConversationHandler>? logger = null)
    : IRequestHandler<StartContractConversationCommand, ContractConversationResponse?>,
      IRequestHandler<SendContractConversationMessageCommand, ContractConversationResponse?>
{
    public async Task<ContractConversationResponse?> Handle(
        StartContractConversationCommand command, CancellationToken ct)
    {
        var request = command.Request;
        if (string.IsNullOrWhiteSpace(request.Message))
            return null;
        var party = request.OrganizationPartyId.HasValue
            ? await db.OrganizationParties.AsNoTracking().SingleOrDefaultAsync(x =>
                x.Id == request.OrganizationPartyId && x.OrganizationId == tenant.OrganizationId && x.IsActive, ct)
            : await ResolvePartyFromInstructionAsync(request.Message, ct);
        if (party is null)
            throw new InvalidOperationException("نام طرف قرارداد در درخواست پیدا نشد؛ نام ثبت‌شده شرکت را در متن بنویسید یا ابتدا آن را در داده‌های پایه ثبت کنید.");

        var inferredContract = await db.Contracts.AsNoTracking().Where(x =>
                x.OrganizationId == tenant.OrganizationId
                && x.Parties.Any(p => p.DirectoryPartyId == party.Id)
                && x.Document!.Versions.Any(v => v.LifecycleStatus == DocumentVersionLifecycleStatus.Final))
            .OrderByDescending(x => x.StartDate).ThenByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefaultAsync(ct);
        var groupId = request.PrimaryContractGroupId ?? inferredContract?.PrimaryContractGroupId
            ?? await ResolveGroupFromInstructionAsync(request.Message, ct);
        var group = groupId.HasValue
            ? await db.ContractGroups.AsNoTracking().SingleOrDefaultAsync(x =>
                x.Id == groupId && x.OrganizationId == tenant.OrganizationId && x.IsActive, ct)
            : null;
        if (group is null)
            throw new InvalidOperationException("نوع قرارداد از سوابق این شرکت قابل تشخیص نیست؛ برای قرارداد نخست، نوع قرارداد و Template آن را در داده‌های پایه تعریف کنید.");
        var contractYear = request.ContractYear ?? ExtractPersianYear(request.Message);
        if (!contractYear.HasValue || contractYear.Value is < 1300 or > 1600)
            throw new InvalidOperationException("سال قرارداد از تاریخ‌های نوشته‌شده قابل تشخیص نیست.");
        if (authorizer is not null &&
            !await authorizer.CanAccessAsync(DataScopeResourceType.ContractGroup, group.Id, ct)) return null;
        var additionalSources = await FreezeAdditionalSourcesAsync(
            request.AdditionalSourceContractIds ?? [], ct);
        if (additionalSources is null) return null;
        var subject = !string.IsNullOrWhiteSpace(request.Subject)
            ? request.Subject.Trim()
            : InferSubjectFromInstruction(request.Message)
                ?? CleanInheritedSubject(inferredContract?.Subject, contractYear.Value)
                ?? $"قرارداد {party.Name}";

        var conversation = new ContractConversation
        {
            OrganizationId = tenant.OrganizationId,
            OrganizationPartyId = party.Id,
            PrimaryContractGroupId = group.Id,
            RequestedContractYear = contractYear.Value,
            Subject = subject,
            Title = $"{subject} - {party.Name} - {contractYear}",
            CreatedByUserId = tenant.UserId,
            AdditionalSourceSnapshotJson = JsonSerializer.Serialize(additionalSources)
        };
        db.ContractConversations.Add(conversation);
        await AddUserMessageAsync(conversation, request.Message, ct);
        await GenerateOrClarifyAsync(conversation, request.Message, ct);
        audit.Add("contract-conversation.created", nameof(ContractConversation), conversation.Id.ToString());
        await db.SaveChangesAsync(ct);
        return await ContractConversationMapper.LoadAsync(db, tenant.OrganizationId, conversation.Id, ct);
    }

    private async Task<OrganizationParty?> ResolvePartyFromInstructionAsync(string instruction, CancellationToken ct)
    {
        var normalized = NormalizePersianText(instruction);
        var existing = (await db.OrganizationParties.AsNoTracking().Where(x =>
                x.OrganizationId == tenant.OrganizationId && x.IsActive).ToListAsync(ct))
            .Where(x => normalized.Contains(NormalizePersianText(x.Name), StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(x => x.Name.Length).FirstOrDefault();
        if (existing is not null) return existing;

        var nameMatch = Regex.Match(instruction,
            @"(?:با\s+)?شرکت\s+(?<name>.+?)\s+از\s+تاریخ", RegexOptions.IgnoreCase);
        if (!nameMatch.Success) return null;
        var name = nameMatch.Groups["name"].Value.Trim(' ', '،', ',', '.', '؛');
        if (string.IsNullOrWhiteSpace(name)) return null;
        var representative = Regex.Match(instruction,
            @"نماینده\s+(?:شرکت\s+)?(?:آقای|خانم)?\s*(?<name>.+?)(?=\s+(?:باشه|باشد|با\s+شماره|و\s+شماره|شماره))",
            RegexOptions.IgnoreCase).Groups["name"].Value.Trim();
        var nationalId = Regex.Match(ToLatinDigits(instruction),
            @"شماره\s+ملی\s*(?<value>\d+)", RegexOptions.IgnoreCase).Groups["value"].Value;
        var address = Regex.Match(instruction,
            @"آدرس\s+(?<value>.+?)(?=$|[\r\n]|\s+(?:شماره\s+تماس|تلفن)\b)",
            RegexOptions.IgnoreCase).Groups["value"].Value.Trim(' ', '،', ',', '.', '؛');
        var party = new OrganizationParty
        {
            OrganizationId = tenant.OrganizationId,
            Name = name,
            RepresentativeName = string.IsNullOrWhiteSpace(representative) ? null : representative,
            NationalIdentifier = string.IsNullOrWhiteSpace(nationalId) ? null : nationalId,
            Address = string.IsNullOrWhiteSpace(address) ? null : address,
            CreatedByUserId = tenant.UserId
        };
        db.OrganizationParties.Add(party);
        await db.SaveChangesAsync(ct);
        audit.Add("contract-party.created-from-instruction", nameof(OrganizationParty), party.Id.ToString());
        return party;
    }

    private async Task<Guid?> ResolveGroupFromInstructionAsync(string instruction, CancellationToken ct)
    {
        var normalized = NormalizePersianText(instruction);
        return (await db.ContractGroups.AsNoTracking().Where(x =>
                x.OrganizationId == tenant.OrganizationId && x.IsActive).ToListAsync(ct))
            .Where(x => normalized.Contains(NormalizePersianText(x.Name), StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(x => x.Name.Length).Select(x => (Guid?)x.Id).FirstOrDefault();
    }

    private static int? ExtractPersianYear(string instruction)
    {
        var normalized = instruction.Replace('۰', '0').Replace('۱', '1').Replace('۲', '2')
            .Replace('۳', '3').Replace('۴', '4').Replace('۵', '5').Replace('۶', '6')
            .Replace('۷', '7').Replace('۸', '8').Replace('۹', '9');
        var match = Regex.Match(normalized,
            @"(?<!\d)(1[3-5]\d{2})[/.\-](?:0?[1-9]|1[0-2])[/.\-](?:0?[1-9]|[12]\d|3[01])(?!\d)");
        if (!match.Success)
        {
            var yearAtEnd = Regex.Match(normalized,
                @"(?<!\d)(?:0?[1-9]|[12]\d|3[01])[/.\-](?:0?[1-9]|1[0-2])[/.\-](1[3-5]\d{2})(?!\d)");
            if (yearAtEnd.Success) match = yearAtEnd;
        }
        if (!match.Success)
            match = Regex.Match(normalized, @"(?:سال\s*)(1[3-5]\d{2})(?!\d)");
        if (!match.Success)
            match = Regex.Match(normalized, @"(?<!\d)(1[3-5]\d{2})(?=[/\-\s]|$)");
        return match.Success && int.TryParse(match.Groups[1].Value, out var year) ? year : null;
    }

    private static string NormalizePersianText(string value) => value.Trim()
        .Replace('ي', 'ی').Replace('ك', 'ک').Replace("‌", " ")
        .Replace("شرکت", "", StringComparison.OrdinalIgnoreCase).Trim();

    private static string ToLatinDigits(string value) => value
        .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2').Replace('۳', '3')
        .Replace('۴', '4').Replace('۵', '5').Replace('۶', '6').Replace('۷', '7')
        .Replace('۸', '8').Replace('۹', '9').Replace('٠', '0').Replace('١', '1')
        .Replace('٢', '2').Replace('٣', '3').Replace('٤', '4').Replace('٥', '5')
        .Replace('٦', '6').Replace('٧', '7').Replace('٨', '8').Replace('٩', '9');

    private static string? InferSubjectFromInstruction(string instruction)
    {
        var patterns = new[]
        {
            @"موضوع\s+قرارداد(?:\s+را|\s*:)?\s*[«\""']?(?<subject>.+?)[»\""']?\s+(?:باشد|است|شود)",
            @"قرارداد(?:\s+جدید)?\s+برای\s+(?<subject>.+?)\s+را\s+بر\s+اساس",
            @"قرارداد\s+(?<subject>.+?)\s+با\s+شرکت"
        };
        foreach (var pattern in patterns)
        {
            var matches = Regex.Matches(instruction, pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline);
            if (matches.Count == 0) continue;
            var subject = matches[^1].Groups["subject"].Value.Trim()
                .Trim('«', '»', '"', '\'', ' ', '.', '،', '؛');
            if (!string.IsNullOrWhiteSpace(subject)) return subject;
        }
        return null;
    }

    private static string? CleanInheritedSubject(string? subject, int contractYear)
    {
        if (string.IsNullOrWhiteSpace(subject)) return null;
        var cleaned = Regex.Replace(subject.Trim(), @"\s+(?:سال\s*)?1[3-5]\d{2}\s*$", "").Trim();
        return string.IsNullOrWhiteSpace(cleaned) ? $"قرارداد {contractYear}" : cleaned;
    }

    public async Task<ContractConversationResponse?> Handle(
        SendContractConversationMessageCommand command, CancellationToken ct)
    {
        var conversation = await LoadConversationAsync(command.Id, ct);
        if (conversation is null || conversation.Status == ContractConversationStatus.Cancelled
            || string.IsNullOrWhiteSpace(command.Message)) return null;
        if (authorizer is not null && !await authorizer.CanAccessAsync(
            DataScopeResourceType.ContractGroup, conversation.PrimaryContractGroupId, ct)) return null;
        if (conversation.Status == ContractConversationStatus.Completed && conversation.BaseContractId.HasValue)
        {
            conversation.BaseDocumentVersionId = await db.Contracts.AsNoTracking()
                .Where(x => x.Id == conversation.BaseContractId && x.OrganizationId == tenant.OrganizationId)
                .SelectMany(x => x.Document!.Versions)
                .Where(x => x.LifecycleStatus == DocumentVersionLifecycleStatus.Final)
                .OrderByDescending(x => x.VersionNumber).Select(x => (Guid?)x.Id).FirstOrDefaultAsync(ct);
        }

        foreach (var clarification in conversation.Clarifications.Where(x => !x.IsAnswered))
        {
            clarification.Answer = command.Message.Trim();
            clarification.IsAnswered = true;
            clarification.AnsweredAtUtc = DateTime.UtcNow;
            clarification.AnsweredByUserId = tenant.UserId;
        }
        await AddUserMessageAsync(conversation, command.Message, ct);
        var completeInstruction = string.Join("\n", conversation.Messages
            .Where(x => x.Role == ContractMessageRole.User).OrderBy(x => x.Sequence).Select(x => x.Content));
        var correctedYear = ExtractPersianYear(completeInstruction);
        if (correctedYear is >= 1300 and <= 1600)
            conversation.RequestedContractYear = correctedYear.Value;
        var correctedSubject = InferSubjectFromInstruction(command.Message)
            ?? InferSubjectFromInstruction(completeInstruction);
        if (!string.IsNullOrWhiteSpace(correctedSubject))
        {
            conversation.Subject = correctedSubject;
            var partyName = await db.OrganizationParties.AsNoTracking()
                .Where(x => x.Id == conversation.OrganizationPartyId).Select(x => x.Name).SingleAsync(ct);
            conversation.Title = $"{correctedSubject} - {partyName} - {conversation.RequestedContractYear}";
        }
        conversation.Status = ContractConversationStatus.Active;
        await GenerateOrClarifyAsync(conversation, completeInstruction, ct);
        conversation.UpdatedAtUtc = DateTime.UtcNow;
        audit.Add("contract-conversation.message-added", nameof(ContractConversation), conversation.Id.ToString());
        await db.SaveChangesAsync(ct);
        return await ContractConversationMapper.LoadAsync(db, tenant.OrganizationId, conversation.Id, ct);
    }

    private async Task<ContractConversation?> LoadConversationAsync(Guid id, CancellationToken ct) =>
        await db.ContractConversations.Include(x => x.Messages).Include(x => x.Clarifications)
            .Include(x => x.Drafts).SingleOrDefaultAsync(x =>
                x.Id == id && x.OrganizationId == tenant.OrganizationId, ct);

    private Task AddUserMessageAsync(ContractConversation conversation, string message, CancellationToken ct)
    {
        var sequence = conversation.Messages.Count == 0 ? 1 : conversation.Messages.Max(x => x.Sequence) + 1;
        var item = new ContractConversationMessage
        {
            ConversationId = conversation.Id,
            Sequence = sequence, Role = ContractMessageRole.User,
            Content = message.Trim(), CreatedByUserId = tenant.UserId
        };
        conversation.Messages.Add(item);
        db.ContractConversationMessages.Add(item);
        return Task.CompletedTask;
    }

    private async Task GenerateOrClarifyAsync(
        ContractConversation conversation, string instruction, CancellationToken ct)
    {
        var baseResult = await ResolveBaseAsync(conversation, instruction, ct);
        if (baseResult.Ambiguous)
        {
            AddClarification(conversation, "base-contract", "چند قرارداد مرجع هم‌اولویت یافت شد؛ شماره قرارداد مورد نظر را مشخص کنید.");
            return;
        }
        if (conversation.BaseContractId.HasValue && baseResult.Contract is null)
        {
            AddClarification(conversation, "frozen-base-invalid",
                "نسخه مرجع Freeze‌شده دیگر Final و فعال نیست؛ یک گفت‌وگوی جدید با مرجع معتبر شروع کنید.");
            return;
        }
        conversation.BaseContractId = baseResult.Contract?.Id;
        conversation.BaseDocumentVersionId = baseResult.Version?.Id;
        var sourceContract = baseResult.Contract ?? new Contract
        {
            OrganizationId = tenant.OrganizationId, DocumentId = Guid.Empty,
            Subject = conversation.Subject, Currency = "IRR"
        };
        var changes = ContractChangeSetParser.Parse(instruction, sourceContract);
        var newClauses = changes.NewClauses is { Count: > 0 }
            ? changes.NewClauses
            : string.IsNullOrWhiteSpace(changes.NewClause) ? [] : [changes.NewClause];
        if (changes.Questions.Count > 0)
        {
            foreach (var question in changes.Questions)
                AddClarification(conversation, $"input-{question.GetHashCode():X}", question);
            return;
        }
        var organization = await db.Organizations.AsNoTracking().SingleAsync(
            x => x.Id == tenant.OrganizationId, ct);
        if (!OrganizationProfileIsComplete(organization))
            throw new InvalidOperationException(
                "اطلاعات شرکت ما کامل نیست. ابتدا از داده‌های پایه ← اطلاعات شرکت ما، مشخصات طرف اول قرارداد را تکمیل کنید.");
        var baseClauseCount = CountContractClauses(sourceContract, baseResult.Version?.ExtractedText);
        var targetDate = changes.StartDate ?? FirstDayOfPersianYear(conversation.RequestedContractYear);
        var template = await db.ContractTemplates.AsNoTracking().Where(x =>
                x.OrganizationId == tenant.OrganizationId && x.ContractGroupId == conversation.PrimaryContractGroupId
                && x.IsActive && (x.ContractYear == null || x.ContractYear == conversation.RequestedContractYear)
                && (x.EffectiveFrom == null || x.EffectiveFrom <= targetDate)
                && (x.EffectiveTo == null || x.EffectiveTo >= targetDate))
            .OrderByDescending(x => x.ContractYear == conversation.RequestedContractYear)
            .ThenByDescending(x => x.Version).FirstOrDefaultAsync(ct);
        if (template is null)
        {
            var groupName = await db.ContractGroups.AsNoTracking()
                .Where(x => x.Id == conversation.PrimaryContractGroupId)
                .Select(x => x.Name).SingleOrDefaultAsync(ct) ?? "انتخاب‌شده";
            AddClarification(conversation, "effective-template",
                $"برای نوع قرارداد «{groupName}» در سال {conversation.RequestedContractYear} و تاریخ درخواستی، Template فعالی وجود ندارد. از داده‌های پایه ← Templateهای قرارداد، یک قالب معتبر برای همین نوع و سال ثبت کنید.");
            return;
        }

        var approvedClauses = baseResult.Contract is null
            ? await db.ApprovedContractClauses.AsNoTracking().Where(x =>
                    x.OrganizationId == tenant.OrganizationId
                    && x.ContractGroupId == conversation.PrimaryContractGroupId && x.IsActive)
                .OrderBy(x => x.Order).Select(x => new { x.Id, x.Code, x.Title, x.Text, x.IsRequired })
                .ToListAsync(ct)
            : [];
        var additionalSources = string.IsNullOrWhiteSpace(conversation.AdditionalSourceSnapshotJson)
            ? [] : JsonSerializer.Deserialize<List<FrozenContractSource>>(
                conversation.AdditionalSourceSnapshotJson) ?? [];
        var embeddingModel = await GetEmbeddingModelAsync(ct);
        IReadOnlyList<AiRagSearchResult> ragSources = [];
        try
        {
            if (baseResult.Version is not null && ai is not null)
            {
                if (!baseResult.Version.IsRagPublished)
                {
                    AddClarification(conversation, "base-rag",
                        "نسخه نهایی مرجع هنوز در RAG منتشر نشده است؛ ابتدا نسخه مرجع را نهایی و منتشر کنید.");
                    return;
                }
                var groupIds = additionalSources.Select(x => x.ContractGroupId)
                    .Append(conversation.PrimaryContractGroupId).Distinct().Select(x => x.ToString()).ToArray();
                var documentIds = additionalSources.Select(x => x.DocumentId)
                    .Append(baseResult.Contract!.DocumentId).Distinct().ToArray();
                ragSources = await ai.SearchAsync(tenant.OrganizationId, tenant.UserId,
                    groupIds, instruction, documentIds, embeddingModel, 8, ct);
            }
            else if (additionalSources.Count > 0 && ai is not null)
            {
                ragSources = await ai.SearchAsync(tenant.OrganizationId, tenant.UserId,
                    additionalSources.Select(x => x.ContractGroupId.ToString()).Distinct().ToArray(),
                    instruction, additionalSources.Select(x => x.DocumentId).Distinct().ToArray(),
                    embeddingModel, 8, ct);
            }
        }
        catch (HttpRequestException exception)
        {
            logger?.LogWarning(exception,
                "RAG search failed for contract conversation {ConversationId}; using frozen extracted text.",
                conversation.Id);
            audit.Add("contract-rag.search-fallback", nameof(ContractConversation),
                conversation.Id.ToString(), new { exception.Message, EmbeddingModel = embeddingModel });
        }
        var baseEvidence = string.Join("\n\n", ragSources.Select(x => x.Text));
        if (string.IsNullOrWhiteSpace(baseEvidence)) baseEvidence = baseResult.Version?.ExtractedText ?? "";
        var conflicts = ContractConflictAnalyzer.Analyze(instruction, sourceContract, changes,
            baseEvidence, approvedClauses.Select(x => x.Text).ToArray());
        foreach (var conflict in conflicts.Where(x => x.IsBlocking))
            AddClarification(conversation, $"conflict-{conflict.Code}",
                $"{conflict.Message} {conflict.Suggestion}");
        if (conflicts.Any(x => x.IsBlocking)) return;
        var sourceTitles = additionalSources.ToDictionary(x => x.DocumentId, x => x.DocumentTitle);
        if (baseResult.Contract is not null) sourceTitles[baseResult.Contract.DocumentId] =
            baseResult.Contract.Document?.Title ?? "";
        var sourceSnapshot = JsonSerializer.Serialize(new
        {
            Mode = baseResult.Contract is null ? "greenfield" : "renewal",
            BaseContractId = baseResult.Contract?.Id,
            BaseDocumentVersionId = baseResult.Version?.Id,
            BaseLifecycle = baseResult.Version?.LifecycleStatus.ToString(),
            TemplateId = template.Id, TemplateVersion = template.Version,
            TemplateContractYear = template.ContractYear,
            PrimaryContractGroupId = conversation.PrimaryContractGroupId,
            ApprovedClauseCatalog = approvedClauses,
            ExplicitAdditionalSources = additionalSources,
            RagCitations = ragSources.Select(x => new
            {
                x.Citation.DocumentId, x.Citation.VersionId, x.Citation.Page,
                x.Citation.Section, x.Score, Evidence = x.Text,
                DocumentTitle = sourceTitles.GetValueOrDefault(x.Citation.DocumentId, "")
            }),
            DirectUserClause = changes.NewClause,
            DirectUserClauses = newClauses,
            OrganizationProfile = new
            {
                organization.Name,
                organization.ChiefExecutiveName,
                organization.ChiefExecutiveFatherName,
                organization.ChiefExecutiveNationalId,
                organization.NationalIdentifier,
                organization.EconomicCode,
                organization.RegistrationNumber,
                organization.Address,
                organization.PostalCode,
                organization.Phone,
                organization.Fax,
                organization.Email,
                organization.Website
            },
            Rule = "highest-final-persian-year-and-version"
        });
        var calculations = JsonSerializer.Serialize(new
        {
            OriginalAmount = sourceContract.Amount, changes.Amount, changes.IncreasePercent,
            changes.CalculatedAmount,
            Formula = changes.Amount.HasValue ? "explicitAmount" : "originalAmount * (1 + increasePercent / 100)"
        });
        var diff = JsonSerializer.Serialize(new
        {
            StartDate = new { Before = sourceContract.StartDate, After = changes.StartDate },
            EndDate = new { Before = sourceContract.EndDate, After = changes.EndDate },
            Amount = new { Before = sourceContract.Amount, After = changes.CalculatedAmount },
            AddedClause = changes.NewClause,
            AddedClauses = newClauses,
            PaymentDates = new
            {
                First = changes.FirstPaymentDate,
                Second = changes.SecondPaymentDate
            },
            ClauseCount = new
            {
                Before = baseClauseCount,
                After = baseClauseCount + newClauses.Count
            },
            Conflicts = conflicts
        });
        var conflictJson = JsonSerializer.Serialize(conflicts);
        var templateFile = await files.DownloadAsync(template.FileId,
            CreateContractTemplateHandler.Bearer(context), ct);
        var party = await db.OrganizationParties.AsNoTracking()
            .SingleAsync(x => x.Id == conversation.OrganizationPartyId, ct);
        var partyName = party.Name;
        var values = new Dictionary<string, string>
        {
            ["subject"] = conversation.Subject,
            ["contractNumber"] = sourceContract.ContractNumber ?? "",
            ["startDate"] = PersianDate.Format(changes.StartDate!.Value),
            ["endDate"] = PersianDate.Format(changes.EndDate!.Value),
            ["amount"] = changes.CalculatedAmount!.Value.ToString("N0"),
            ["currency"] = CurrencyDisplayName(sourceContract.Currency),
            ["newClause"] = changes.NewClause ?? "",
            ["newClausesJson"] = JsonSerializer.Serialize(newClauses),
            ["newClauseNumber"] = (baseClauseCount + 1).ToString(CultureInfo.InvariantCulture),
            ["firstPaymentDate"] = changes.FirstPaymentDate.HasValue
                ? PersianDate.Format(changes.FirstPaymentDate.Value) : PersianDate.Format(changes.StartDate!.Value),
            ["secondPaymentDate"] = changes.SecondPaymentDate.HasValue
                ? PersianDate.Format(changes.SecondPaymentDate.Value) : "",
            ["approvedClauses"] = string.Join("\n\n", approvedClauses.Select(x => $"{x.Code} - {x.Title}\n{x.Text}")),
            ["partyName"] = partyName,
            ["organizationName"] = organization.Name,
            ["organizationRepresentative"] = organization.ChiefExecutiveName ?? "",
            ["organizationChiefExecutiveName"] = organization.ChiefExecutiveName ?? "",
            ["organizationFatherName"] = organization.ChiefExecutiveFatherName ?? "",
            ["organizationChiefExecutiveFatherName"] = organization.ChiefExecutiveFatherName ?? "",
            ["organizationRepresentativeNationalIdentifier"] = organization.ChiefExecutiveNationalId ?? "",
            ["organizationChiefExecutiveNationalId"] = organization.ChiefExecutiveNationalId ?? "",
            ["organizationNationalIdentifier"] = organization.NationalIdentifier ?? "",
            ["organizationEconomicCode"] = organization.EconomicCode ?? "",
            ["organizationRegistrationNumber"] = organization.RegistrationNumber ?? "",
            ["organizationPhone"] = organization.Phone ?? "",
            ["organizationAddress"] = organization.Address ?? "",
            ["organizationPostalCode"] = organization.PostalCode ?? "",
            ["organizationFax"] = organization.Fax ?? "",
            ["organizationEmail"] = organization.Email ?? "",
            ["organizationWebsite"] = organization.Website ?? "",
            ["نام شرکت"] = organization.Name,
            ["نام مدیرعامل"] = organization.ChiefExecutiveName ?? "",
            ["نام پدر مدیرعامل"] = organization.ChiefExecutiveFatherName ?? "",
            ["شماره ملی مدیرعامل"] = organization.ChiefExecutiveNationalId ?? "",
            ["شناسه ملی شرکت"] = organization.NationalIdentifier ?? "",
            ["شماره اقتصادی شرکت"] = organization.EconomicCode ?? "",
            ["شماره ثبت شرکت"] = organization.RegistrationNumber ?? "",
            ["آدرس شرکت"] = organization.Address ?? "",
            ["کد پستی شرکت"] = organization.PostalCode ?? "",
            ["تلفن شرکت"] = organization.Phone ?? "",
            ["فکس شرکت"] = organization.Fax ?? "",
            ["ایمیل شرکت"] = organization.Email ?? "",
            ["وب سایت شرکت"] = organization.Website ?? "",
            ["counterpartyName"] = party.Name,
            ["counterpartyNationalIdentifier"] = party.NationalIdentifier ?? "",
            ["counterpartyRepresentative"] = party.RepresentativeName ?? "",
            ["counterpartyFatherName"] = "",
            ["counterpartyPhone"] = party.ContactInfo ?? "",
            ["counterpartyAddress"] = party.Address ?? "",
            ["signingDate"] = PersianDate.Format(DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3.5)))
        };
        var generated = await generator.GenerateAsync(templateFile.Content, values, ct);
        var version = conversation.Drafts.Count == 0 ? 1 : conversation.Drafts.Max(x => x.VersionNumber) + 1;
        var pdf = await generator.GeneratePdfAsync(new ContractPdfRequest(
            conversation.Id, version, conversation.Subject, partyName,
            values["startDate"], values["endDate"], values["amount"], values["currency"],
            string.Join("\n", newClauses), values["approvedClauses"], diff,
            ragSources.Select(x => new ContractPdfCitation(
                sourceTitles.GetValueOrDefault(x.Citation.DocumentId, ""),
                x.Citation.DocumentId, x.Citation.VersionId, x.Citation.Page,
                x.Citation.Section, x.Text)).ToList(), DateTime.UtcNow), ct);
        await using var stream = new MemoryStream(generated);
        var fileId = await files.UploadAsync(stream, $"contract-draft-{conversation.Id:N}-v{version}.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            CreateContractTemplateHandler.Bearer(context), ct);
        await using var pdfStream = new MemoryStream(pdf);
        var pdfFileId = await files.UploadAsync(pdfStream,
            $"contract-draft-{conversation.Id:N}-v{version}.pdf", "application/pdf",
            CreateContractTemplateHandler.Bearer(context), ct);
        var draft = new ContractDraftVersion
        {
            ConversationId = conversation.Id,
            VersionNumber = version, BaseContractId = baseResult.Contract?.Id,
            BaseDocumentVersionId = baseResult.Version?.Id, ContractTemplateId = template.Id,
            InstructionSnapshot = instruction, ChangeSetJson = JsonSerializer.Serialize(changes),
            SourceSnapshotJson = sourceSnapshot, CalculationSnapshotJson = calculations,
            DiffJson = diff, ConflictAnalysisJson = conflictJson,
            GeneratedDocxFileId = fileId, GeneratedPdfFileId = pdfFileId,
            CreatedByUserId = tenant.UserId
        };
        conversation.Drafts.Add(draft);
        db.ContractDraftVersions.Add(draft);
        AddAssistantMessage(conversation,
            $"پیش‌نویس نسخه {version} تولید شد. منابع، محاسبات و تغییرات برای بازبینی ثبت شده‌اند.", sourceSnapshot);
        conversation.Status = ContractConversationStatus.InReview;
    }

    private static string CurrencyDisplayName(string? currency) => currency?.Trim().ToUpperInvariant() switch
    {
        "IRR" => "ریال",
        "IRT" => "تومان",
        "USD" => "دلار آمریکا",
        "EUR" => "یورو",
        _ => string.IsNullOrWhiteSpace(currency) ? "ریال" : currency
    };

    private static bool OrganizationProfileIsComplete(Organization organization) =>
        !string.IsNullOrWhiteSpace(organization.Name)
        && !string.IsNullOrWhiteSpace(organization.ChiefExecutiveName)
        && !string.IsNullOrWhiteSpace(organization.ChiefExecutiveFatherName)
        && !string.IsNullOrWhiteSpace(organization.ChiefExecutiveNationalId)
        && !string.IsNullOrWhiteSpace(organization.NationalIdentifier)
        && !string.IsNullOrWhiteSpace(organization.EconomicCode)
        && !string.IsNullOrWhiteSpace(organization.Address)
        && !string.IsNullOrWhiteSpace(organization.Phone);

    private static int CountContractClauses(Contract contract, string? extractedText)
    {
        var extractedCount = string.IsNullOrWhiteSpace(extractedText) ? 0 : Regex.Matches(
            extractedText, @"(?m)^\s*(?:ماده|بند)\s*[\p{N}۰-۹]+(?:\s|[.\-:])").Count;
        return Math.Max(contract.Clauses.Count, extractedCount);
    }

    private void AddClarification(ContractConversation conversation, string key, string question)
    {
        if (!conversation.Clarifications.Any(x => !x.IsAnswered && x.Key == key))
        {
            var clarification = new ContractClarification
                { ConversationId = conversation.Id, Key = key, Question = question };
            conversation.Clarifications.Add(clarification);
            db.ContractClarifications.Add(clarification);
        }
        AddAssistantMessage(conversation, question, null);
        conversation.Status = ContractConversationStatus.NeedsClarification;
    }

    private void AddAssistantMessage(ContractConversation conversation, string message, string? sources)
    {
        var sequence = conversation.Messages.Count == 0 ? 1 : conversation.Messages.Max(x => x.Sequence) + 1;
        var item = new ContractConversationMessage
        {
            ConversationId = conversation.Id,
            Sequence = sequence, Role = ContractMessageRole.Assistant,
            Content = message, SourceSnapshotJson = sources
        };
        conversation.Messages.Add(item);
        db.ContractConversationMessages.Add(item);
    }

    private async Task<BaseResolution> ResolveBaseAsync(
        ContractConversation conversation, string instruction, CancellationToken ct)
    {
        if (conversation.BaseContractId.HasValue && conversation.BaseDocumentVersionId.HasValue)
        {
            var frozen = await db.Contracts.AsNoTracking().Include(x => x.Document)
                .ThenInclude(x => x!.Versions).Include(x => x.Parties)
                .Include(x => x.GroupMemberships).Include(x => x.Clauses).SingleOrDefaultAsync(x =>
                    x.Id == conversation.BaseContractId && x.OrganizationId == tenant.OrganizationId, ct);
            var version = frozen?.Document?.Versions.SingleOrDefault(x =>
                x.Id == conversation.BaseDocumentVersionId
                && x.LifecycleStatus == DocumentVersionLifecycleStatus.Final && x.IsRagPublished);
            return frozen is null || version is null ? new(null, null, false)
                : new(frozen, version, false);
        }
        var candidates = await db.Contracts.AsNoTracking()
            .Include(x => x.Document).ThenInclude(x => x!.Versions)
            .Include(x => x.Parties).Include(x => x.GroupMemberships).Include(x => x.Clauses)
            .Where(x => x.OrganizationId == tenant.OrganizationId
                && x.Parties.Any(p => p.DirectoryPartyId == conversation.OrganizationPartyId)
                && x.GroupMemberships.Any(g => g.ContractGroupId == conversation.PrimaryContractGroupId && g.IsPrimary)
                && x.Document!.Versions.Any(v => v.LifecycleStatus == DocumentVersionLifecycleStatus.Final))
            .ToListAsync(ct);
        if (candidates.Count == 0) return new(null, null, false);
        var ranked = candidates.Select(x => new
        {
            Contract = x,
            Year = x.StartDate.HasValue ? new PersianCalendar().GetYear(
                x.StartDate.Value.ToDateTime(TimeOnly.MinValue)) : 0,
            Version = x.Document!.Versions.Where(v => v.LifecycleStatus == DocumentVersionLifecycleStatus.Final)
                .OrderByDescending(v => v.VersionNumber).First()
        }).Where(x => x.Year <= conversation.RequestedContractYear)
          .OrderByDescending(x => x.Year).ThenByDescending(x => x.Version.VersionNumber).ToList();
        if (ranked.Count == 0) return new(null, null, false);
        var top = ranked[0];
        var ties = ranked.Where(x => x.Year == top.Year && x.Version.VersionNumber == top.Version.VersionNumber).ToList();
        if (ties.Count > 1)
        {
            var selected = ties.SingleOrDefault(x => !string.IsNullOrWhiteSpace(x.Contract.ContractNumber)
                && instruction.Contains(x.Contract.ContractNumber, StringComparison.OrdinalIgnoreCase));
            if (selected is null) return new(null, null, true);
            top = selected;
        }
        return new(top.Contract, top.Version, false);
    }

    private static DateOnly FirstDayOfPersianYear(int year)
    {
        var value = new PersianCalendar().ToDateTime(year, 1, 1, 0, 0, 0, 0);
        return DateOnly.FromDateTime(value);
    }

    private async Task<string> GetEmbeddingModelAsync(CancellationToken ct)
    {
        var json = await db.RuntimeSettings.AsNoTracking().Where(x =>
                x.OrganizationId == tenant.OrganizationId && x.Category == "ai"
                && x.Key == "embedding.model" && x.IsActive)
            .Select(x => x.ValueJson).SingleOrDefaultAsync(ct);
        if (string.IsNullOrWhiteSpace(json)) return "BAAI/bge-m3";
        using var parsed = JsonDocument.Parse(json);
        return parsed.RootElement.TryGetProperty("modelId", out var value)
            ? value.GetString() ?? "BAAI/bge-m3" : "BAAI/bge-m3";
    }

    private async Task<List<FrozenContractSource>?> FreezeAdditionalSourcesAsync(
        IReadOnlyCollection<Guid> ids, CancellationToken ct)
    {
        var distinct = ids.Where(x => x != Guid.Empty).Distinct().Take(10).ToArray();
        if (distinct.Length == 0) return [];
        var contracts = await db.Contracts.AsNoTracking().Include(x => x.Document)
            .ThenInclude(x => x!.Versions).Include(x => x.Parties)
            .Include(x => x.GroupMemberships).ThenInclude(x => x.ContractGroup)
            .Where(x => x.OrganizationId == tenant.OrganizationId && distinct.Contains(x.Id))
            .ToListAsync(ct);
        if (contracts.Count != distinct.Length) return null;
        var result = new List<FrozenContractSource>();
        foreach (var contract in contracts)
        {
            var primary = contract.GroupMemberships.SingleOrDefault(x => x.IsPrimary);
            var version = contract.Document!.Versions.Where(x =>
                    x.LifecycleStatus == DocumentVersionLifecycleStatus.Final && x.IsRagPublished)
                .OrderByDescending(x => x.VersionNumber).FirstOrDefault();
            if (primary is null || version is null || authorizer is not null &&
                !await authorizer.CanAccessAsync(DataScopeResourceType.ContractGroup,
                    primary.ContractGroupId, ct)) return null;
            result.Add(new(contract.Id, contract.DocumentId, version.Id,
                primary.ContractGroupId, primary.ContractGroup?.Name ?? "",
                contract.Document.Title, contract.Subject));
        }
        return result;
    }

    private sealed record BaseResolution(Contract? Contract, DocumentVersion? Version, bool Ambiguous);
    private sealed record FrozenContractSource(Guid ContractId, Guid DocumentId,
        Guid VersionId, Guid ContractGroupId, string GroupName, string DocumentTitle, string Subject);
}

public sealed class GetContractConversationHandler(NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<GetContractConversationQuery, ContractConversationResponse?>,
      IRequestHandler<ListContractConversationsQuery, IReadOnlyList<ContractConversationListItemResponse>>
{
    public Task<ContractConversationResponse?> Handle(GetContractConversationQuery request, CancellationToken ct) =>
        ContractConversationMapper.LoadAsync(db, tenant.OrganizationId, request.Id, ct);

    public async Task<IReadOnlyList<ContractConversationListItemResponse>> Handle(
        ListContractConversationsQuery request, CancellationToken ct) =>
        await db.ContractConversations.AsNoTracking().Where(x =>
                x.OrganizationId == tenant.OrganizationId && x.CreatedByUserId == tenant.UserId)
            .OrderByDescending(x => x.UpdatedAtUtc).Take(100)
            .Select(x => new ContractConversationListItemResponse(x.Id, x.Title,
                x.OrganizationParty!.Name, x.PrimaryContractGroup!.Name,
                x.RequestedContractYear, x.Status, x.Drafts.Count, x.UpdatedAtUtc)).ToListAsync(ct);
}

public sealed class DownloadContractDraftHandler(
    NegareshDbContext db, ICurrentTenant tenant, IFileManagerClient files,
    IHttpContextAccessor context) : IRequestHandler<DownloadContractDraftQuery, ContractDraftDownload?>
{
    public async Task<ContractDraftDownload?> Handle(DownloadContractDraftQuery request, CancellationToken ct)
    {
        var format = request.Format.Trim().ToLowerInvariant();
        if (format is not ("docx" or "pdf")) return null;
        var row = await db.ContractDraftVersions.AsNoTracking().Where(x =>
                x.Id == request.DraftId && x.ConversationId == request.ConversationId
                && x.Conversation!.OrganizationId == tenant.OrganizationId)
            .Select(x => new { x.GeneratedDocxFileId, x.GeneratedPdfFileId, x.VersionNumber })
            .SingleOrDefaultAsync(ct);
        var fileId = format == "pdf" ? row?.GeneratedPdfFileId : row?.GeneratedDocxFileId;
        if (string.IsNullOrWhiteSpace(fileId)) return null;
        var downloaded = await files.DownloadAsync(fileId,
            CreateContractTemplateHandler.Bearer(context), ct);
        var contentType = format == "pdf" ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        return new(downloaded.Content, $"contract-draft-v{row!.VersionNumber}.{format}", contentType);
    }
}

public sealed class ListContractSourceOptionsHandler(
    NegareshDbContext db, ICurrentTenant tenant, IDataScopeAuthorizer? authorizer = null)
    : IRequestHandler<ListContractSourceOptionsQuery, IReadOnlyList<ContractSourceOptionResponse>>
{
    public async Task<IReadOnlyList<ContractSourceOptionResponse>> Handle(
        ListContractSourceOptionsQuery request, CancellationToken ct)
    {
        var allowed = authorizer is null ? null : await authorizer.GetAllowedResourceIdsAsync(
            DataScopeResourceType.ContractGroup, ct);
        var query = db.Contracts.AsNoTracking().Where(x => x.OrganizationId == tenant.OrganizationId
            && x.PrimaryContractGroupId.HasValue
            && x.Document!.Versions.Any(v => v.LifecycleStatus == DocumentVersionLifecycleStatus.Final
                && v.IsRagPublished));
        if (allowed is not null) query = query.Where(x =>
            x.PrimaryContractGroupId.HasValue && allowed.Contains(x.PrimaryContractGroupId.Value));
        var rows = await query.OrderByDescending(x => x.UpdatedAtUtc).Take(100).Select(x => new
        {
            x.Id, x.DocumentId, x.Subject, x.ContractNumber, x.StartDate,
            PartyName = x.Parties.OrderBy(p => p.Role).Select(p => p.Name).FirstOrDefault() ?? "",
            GroupId = x.PrimaryContractGroupId!.Value,
            GroupName = x.PrimaryContractGroup!.Name,
            FinalVersionId = x.Document!.Versions.Where(v =>
                    v.LifecycleStatus == DocumentVersionLifecycleStatus.Final && v.IsRagPublished)
                .OrderByDescending(v => v.VersionNumber).Select(v => v.Id).First()
        }).ToListAsync(ct);
        var calendar = new PersianCalendar();
        return rows.Select(x => new ContractSourceOptionResponse(x.Id, x.DocumentId, x.Subject,
            x.ContractNumber, x.PartyName, x.GroupId, x.GroupName,
            x.StartDate.HasValue ? calendar.GetYear(x.StartDate.Value.ToDateTime(TimeOnly.MinValue)) : null,
            x.FinalVersionId)).ToList();
    }
}

public sealed class ReviewContractDraftHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit,
    IFileManagerClient files, IHttpContextAccessor context, IAiDocumentProcessor? ai = null)
    : IRequestHandler<ReviewContractDraftCommand, ContractConversationResponse?>
{
    public async Task<ContractConversationResponse?> Handle(ReviewContractDraftCommand command, CancellationToken ct)
    {
        var transaction = command.ExpectedStatus == ContractDraftApprovalStatus.ManagerReview
            && command.Request.Approved && db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(ct) : null;
        try
        {
            var conversation = await db.ContractConversations.Include(x => x.Drafts).Include(x => x.Messages)
                .SingleOrDefaultAsync(x => x.Id == command.ConversationId
                    && x.OrganizationId == tenant.OrganizationId, ct);
            var draft = conversation?.Drafts.SingleOrDefault(x => x.Id == command.DraftId);
            if (conversation is null || draft is null || draft.ApprovalStatus != command.ExpectedStatus) return null;
            if (!command.Request.Approved)
            {
                draft.ApprovalStatus = ContractDraftApprovalStatus.Rejected;
                conversation.Status = ContractConversationStatus.Active;
                SetReview(draft, command.ExpectedStatus, command.Request.Note, tenant.UserId, false);
                AddReviewMessage(conversation, "پیش‌نویس رد شد؛ اصلاحات را در پیام بعدی اعلام کنید.");
            }
            else if (command.ExpectedStatus == ContractDraftApprovalStatus.RequesterReview)
            {
                SetReview(draft, command.ExpectedStatus, command.Request.Note, tenant.UserId, true);
                draft.ApprovalStatus = ContractDraftApprovalStatus.ExpertReview;
                AddReviewMessage(conversation, "تأیید درخواست‌کننده ثبت شد و پیش‌نویس در انتظار نظر کارشناس است.");
            }
            else if (command.ExpectedStatus == ContractDraftApprovalStatus.ExpertReview)
            {
                SetReview(draft, command.ExpectedStatus, command.Request.Note, tenant.UserId, true);
                draft.ApprovalStatus = ContractDraftApprovalStatus.ManagerReview;
                AddReviewMessage(conversation, "تأیید کارشناس ثبت شد و پیش‌نویس در انتظار تأیید مدیر امور قراردادها است.");
            }
            else
            {
                SetReview(draft, command.ExpectedStatus, command.Request.Note, tenant.UserId, true);
                await FinalizeAsync(conversation, draft, ct);
                draft.ApprovalStatus = ContractDraftApprovalStatus.Final;
                conversation.Status = ContractConversationStatus.Completed;
                AddReviewMessage(conversation, "قرارداد توسط مدیر نهایی شد و نسخه نهایی در مخزن اسناد ثبت گردید.");
            }
            conversation.UpdatedAtUtc = DateTime.UtcNow;
            audit.Add("contract-draft.reviewed", nameof(ContractDraftVersion), draft.Id.ToString(),
                new { command.ExpectedStatus, command.Request.Approved });
            await db.SaveChangesAsync(ct);
            if (transaction is not null) await transaction.CommitAsync(ct);
            return await ContractConversationMapper.LoadAsync(db, tenant.OrganizationId, conversation.Id, ct);
        }
        catch
        {
            if (transaction is not null) await transaction.RollbackAsync(ct);
            throw;
        }
        finally
        {
            if (transaction is not null) await transaction.DisposeAsync();
        }
    }

    private async Task FinalizeAsync(ContractConversation conversation, ContractDraftVersion draft, CancellationToken ct)
    {
        var changeSet = JsonSerializer.Deserialize<ContractChangeSet>(draft.ChangeSetJson)
            ?? throw new InvalidOperationException("Invalid draft change set.");
        Contract contract;
        if (draft.BaseContractId.HasValue)
        {
            contract = await db.Contracts.Include(x => x.Document).ThenInclude(x => x!.Versions)
                .Include(x => x.Parties)
                .Include(x => x.Clauses)
                .SingleAsync(x => x.Id == draft.BaseContractId && x.OrganizationId == tenant.OrganizationId, ct);
        }
        else
        {
            var party = await db.OrganizationParties.SingleAsync(x => x.Id == conversation.OrganizationPartyId, ct);
            var document = new Document
            {
                OrganizationId = tenant.OrganizationId, Title = conversation.Title,
                DocumentType = "Contract", OwnerUserId = tenant.UserId,
                ProcessingStatus = DocumentProcessingStatus.Ready
            };
            contract = new Contract
            {
                OrganizationId = tenant.OrganizationId, Document = document,
                Subject = conversation.Subject, PrimaryContractGroupId = conversation.PrimaryContractGroupId,
                Status = ContractStatus.Approved, Currency = "IRR"
            };
            contract.GroupMemberships.Add(new ContractGroupMembership
                { ContractGroupId = conversation.PrimaryContractGroupId, IsPrimary = true });
            contract.Parties.Add(new ContractParty
            {
                DirectoryPartyId = party.Id, Name = party.Name, NationalIdentifier = party.NationalIdentifier,
                RepresentativeName = party.RepresentativeName, Role = ContractPartyRole.SecondParty
            });
            db.Contracts.Add(contract);
        }
        var organization = await db.Organizations.SingleAsync(
            x => x.Id == tenant.OrganizationId, ct);
        var firstParty = contract.Parties.FirstOrDefault(x => x.Role == ContractPartyRole.FirstParty);
        if (firstParty is null)
        {
            firstParty = new ContractParty
            {
                ContractId = contract.Id,
                Role = ContractPartyRole.FirstParty,
                Name = organization.Name,
                NationalIdentifier = organization.NationalIdentifier,
                RepresentativeName = organization.ChiefExecutiveName
            };
            contract.Parties.Add(firstParty);
            db.ContractParties.Add(firstParty);
        }
        else
        {
            firstParty.Name = organization.Name;
            firstParty.NationalIdentifier = organization.NationalIdentifier;
            firstParty.RepresentativeName = organization.ChiefExecutiveName;
        }
        contract.Amount = changeSet.CalculatedAmount ?? contract.Amount;
        contract.Subject = conversation.Subject;
        contract.Document!.Title = conversation.Title;
        contract.StartDate = changeSet.StartDate ?? contract.StartDate;
        contract.EndDate = changeSet.EndDate ?? contract.EndDate;
        contract.Status = ContractStatus.Approved;
        contract.UpdatedAtUtc = DateTime.UtcNow;
        var newClauses = changeSet.NewClauses is { Count: > 0 }
            ? changeSet.NewClauses
            : string.IsNullOrWhiteSpace(changeSet.NewClause) ? [] : [changeSet.NewClause];
        if (newClauses.Count > 0)
        {
            using var diff = JsonDocument.Parse(draft.DiffJson);
            var finalClauseNumber = diff.RootElement.TryGetProperty("ClauseCount", out var clauseCount)
                && clauseCount.TryGetProperty("After", out var after) && after.TryGetInt32(out var parsed)
                ? parsed : contract.Clauses.Count + 1;
            var firstClauseNumber = finalClauseNumber - newClauses.Count + 1;
            for (var index = 0; index < newClauses.Count; index++)
            {
                var clauseText = newClauses[index].Trim();
                if (contract.Clauses.Any(x => x.Text.Trim() == clauseText)) continue;
                var clauseNumber = firstClauseNumber + index;
                var clause = new ContractClause
                {
                    ContractId = contract.Id,
                    ClauseNumber = clauseNumber.ToString(CultureInfo.InvariantCulture),
                    Title = "ماده پیشنهادی کاربر", Text = clauseText, Order = clauseNumber
                };
                contract.Clauses.Add(clause);
                db.ContractClauses.Add(clause);
            }
        }
        await db.SaveChangesAsync(ct);
        var previousFinals = contract.Document!.Versions.Where(x => x.LifecycleStatus == DocumentVersionLifecycleStatus.Final).ToList();
        foreach (var previous in previousFinals) previous.LifecycleStatus = DocumentVersionLifecycleStatus.Superseded;
        var next = contract.Document.Versions.Count == 0 ? 1 : contract.Document.Versions.Max(x => x.VersionNumber) + 1;
        var version = new DocumentVersion
        {
            DocumentId = contract.DocumentId, VersionNumber = next, FileId = draft.GeneratedDocxFileId,
            CreatedByUserId = tenant.UserId, LifecycleStatus = DocumentVersionLifecycleStatus.Final,
            ManagerReviewedByUserId = tenant.UserId, ManagerReviewedAtUtc = DateTime.UtcNow,
            ManagerReviewNote = draft.ManagerReviewNote,
            ChangeSummary = $"نسخه نهایی تولید هوشمند - گفت‌وگو {conversation.Id}"
        };
        var bearer = CreateContractTemplateHandler.Bearer(context);
        var docxFile = await files.DownloadAsync(draft.GeneratedDocxFileId, bearer, ct);
        version.Files.Add(ToVersionFile(version.Id, draft.GeneratedDocxFileId, docxFile, 1));
        if (!string.IsNullOrWhiteSpace(draft.GeneratedPdfFileId))
        {
            var pdfFile = await files.DownloadAsync(draft.GeneratedPdfFileId, bearer, ct);
            version.Files.Add(ToVersionFile(version.Id, draft.GeneratedPdfFileId, pdfFile, 2));
        }
        db.DocumentVersions.Add(version);
        await db.SaveChangesAsync(ct);
        draft.FinalDocumentVersionId = version.Id;
        conversation.BaseDocumentVersionId = version.Id;
        if (ai is not null)
        {
            var model = await GetEmbeddingModelAsync(ct);
            foreach (var previous in previousFinals.Where(x => x.IsRagPublished))
            {
                await ai.DeleteVersionAsync(tenant.OrganizationId, contract.DocumentId,
                    previous.Id, model, ct);
                previous.IsRagPublished = false;
                previous.RagPublishedAtUtc = null;
            }
            var processed = await ai.ProcessAsync(tenant.OrganizationId, contract.DocumentId, version.Id,
                docxFile.FileName, docxFile.Content, model, "restricted", [],
                [conversation.PrimaryContractGroupId.ToString()], false, ct);
            version.ExtractedText = processed.ExtractedText;
            if (!string.IsNullOrWhiteSpace(processed.ExtractedText))
            {
                await ai.PublishTextAsync(tenant.OrganizationId, contract.DocumentId, version.Id,
                    processed.ExtractedText, model, "restricted", [],
                    [conversation.PrimaryContractGroupId.ToString()], ct);
                version.IsRagPublished = true;
                version.RagPublishedAtUtc = DateTime.UtcNow;
            }
        }
    }

    private static DocumentVersionFile ToVersionFile(Guid versionId, string fileId,
        FileManagerDownload file, int order) => new()
    {
        DocumentVersionId = versionId, FileId = fileId, FileName = file.FileName,
        ContentType = file.ContentType, SortOrder = order,
        Sha256 = Convert.ToHexString(SHA256.HashData(file.Content)), Size = file.Content.LongLength
    };

    private async Task<string> GetEmbeddingModelAsync(CancellationToken ct)
    {
        var json = await db.RuntimeSettings.AsNoTracking().Where(x => x.OrganizationId == tenant.OrganizationId
            && x.Category == "ai" && x.Key == "embedding.model" && x.IsActive)
            .Select(x => x.ValueJson).SingleOrDefaultAsync(ct);
        if (string.IsNullOrWhiteSpace(json)) return "BAAI/bge-m3";
        using var parsed = JsonDocument.Parse(json);
        return parsed.RootElement.TryGetProperty("modelId", out var value)
            ? value.GetString() ?? "BAAI/bge-m3" : "BAAI/bge-m3";
    }

    private static void SetReview(ContractDraftVersion draft, ContractDraftApprovalStatus status,
        string? note, string userId, bool approved)
    {
        var now = DateTime.UtcNow;
        if (status == ContractDraftApprovalStatus.RequesterReview)
        { draft.RequesterReviewedByUserId = userId; draft.RequesterReviewedAtUtc = now; draft.RequesterReviewNote = note; }
        else if (status == ContractDraftApprovalStatus.ExpertReview)
        { draft.ExpertReviewedByUserId = userId; draft.ExpertReviewedAtUtc = now; draft.ExpertReviewNote = note; }
        else
        { draft.ManagerReviewedByUserId = userId; draft.ManagerReviewedAtUtc = now; draft.ManagerReviewNote = note; }
    }

    private void AddReviewMessage(ContractConversation conversation, string text)
    {
        var item = new ContractConversationMessage
        {
            ConversationId = conversation.Id,
            Sequence = conversation.Messages.Count == 0 ? 1 : conversation.Messages.Max(x => x.Sequence) + 1,
            Role = ContractMessageRole.System, Content = text
        };
        conversation.Messages.Add(item);
        db.ContractConversationMessages.Add(item);
    }
}

internal static class ContractConversationMapper
{
    public static async Task<ContractConversationResponse?> LoadAsync(
        NegareshDbContext db, Guid organizationId, Guid id, CancellationToken ct)
    {
        var x = await db.ContractConversations.AsNoTracking().Include(c => c.OrganizationParty)
            .Include(c => c.PrimaryContractGroup).Include(c => c.Messages)
            .Include(c => c.Clarifications).Include(c => c.Drafts)
            .SingleOrDefaultAsync(c => c.Id == id && c.OrganizationId == organizationId, ct);
        return x is null ? null : new ContractConversationResponse(x.Id, x.Title,
            x.OrganizationPartyId, x.OrganizationParty!.Name, x.PrimaryContractGroupId,
            x.PrimaryContractGroup!.Name, x.RequestedContractYear, x.Subject, x.BaseContractId,
            x.Status, x.Messages.OrderBy(m => m.Sequence).Select(m => new ContractConversationMessageResponse(
                m.Id, m.Sequence, m.Role, m.Content, m.SourceSnapshotJson, m.CreatedAtUtc)).ToList(),
            x.Clarifications.OrderBy(c => c.AskedAtUtc).Select(c => new ContractClarificationResponse(
                c.Id, c.Key, c.Question, c.Answer, c.IsAnswered)).ToList(),
            x.Drafts.OrderByDescending(d => d.VersionNumber).Select(d => new ContractDraftVersionResponse(
                d.Id, d.VersionNumber, d.BaseContractId, d.BaseDocumentVersionId, d.ContractTemplateId,
                d.InstructionSnapshot, d.ChangeSetJson, d.SourceSnapshotJson, d.CalculationSnapshotJson,
                d.DiffJson, string.IsNullOrWhiteSpace(d.ConflictAnalysisJson) ? "[]" : d.ConflictAnalysisJson,
                d.GeneratedDocxFileId, d.GeneratedPdfFileId, d.ApprovalStatus,
                d.FinalDocumentVersionId, d.CreatedAtUtc)).ToList(), x.UpdatedAtUtc);
    }
}
