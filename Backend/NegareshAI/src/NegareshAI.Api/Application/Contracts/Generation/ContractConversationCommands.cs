using System.Globalization;
using System.Security.Cryptography;
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
    IDataScopeAuthorizer? authorizer = null)
    : IRequestHandler<StartContractConversationCommand, ContractConversationResponse?>,
      IRequestHandler<SendContractConversationMessageCommand, ContractConversationResponse?>
{
    public async Task<ContractConversationResponse?> Handle(
        StartContractConversationCommand command, CancellationToken ct)
    {
        var request = command.Request;
        if (request.ContractYear is < 1300 or > 1600 || string.IsNullOrWhiteSpace(request.Message))
            return null;
        var party = await db.OrganizationParties.AsNoTracking().SingleOrDefaultAsync(x =>
            x.Id == request.OrganizationPartyId && x.OrganizationId == tenant.OrganizationId && x.IsActive, ct);
        var group = await db.ContractGroups.AsNoTracking().SingleOrDefaultAsync(x =>
            x.Id == request.PrimaryContractGroupId && x.OrganizationId == tenant.OrganizationId && x.IsActive, ct);
        if (party is null || group is null || authorizer is not null &&
            !await authorizer.CanAccessAsync(DataScopeResourceType.ContractGroup, group.Id, ct)) return null;
        var additionalSources = await FreezeAdditionalSourcesAsync(
            request.AdditionalSourceContractIds ?? [], ct);
        if (additionalSources is null) return null;

        var conversation = new ContractConversation
        {
            OrganizationId = tenant.OrganizationId,
            OrganizationPartyId = party.Id,
            PrimaryContractGroupId = group.Id,
            RequestedContractYear = request.ContractYear,
            Subject = request.Subject.Trim(),
            Title = $"{request.Subject.Trim()} - {party.Name} - {request.ContractYear}",
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

    public async Task<ContractConversationResponse?> Handle(
        SendContractConversationMessageCommand command, CancellationToken ct)
    {
        var conversation = await LoadConversationAsync(command.Id, ct);
        if (conversation is null || conversation.Status is ContractConversationStatus.Completed
            or ContractConversationStatus.Cancelled || string.IsNullOrWhiteSpace(command.Message)) return null;
        if (authorizer is not null && !await authorizer.CanAccessAsync(
            DataScopeResourceType.ContractGroup, conversation.PrimaryContractGroupId, ct)) return null;

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
        var targetDate = FirstDayOfPersianYear(conversation.RequestedContractYear);
        var template = await db.ContractTemplates.AsNoTracking().Where(x =>
                x.OrganizationId == tenant.OrganizationId && x.ContractGroupId == conversation.PrimaryContractGroupId
                && x.IsActive && (x.ContractYear == null || x.ContractYear == conversation.RequestedContractYear)
                && (x.EffectiveFrom == null || x.EffectiveFrom <= targetDate)
                && (x.EffectiveTo == null || x.EffectiveTo >= targetDate))
            .OrderByDescending(x => x.ContractYear == conversation.RequestedContractYear)
            .ThenByDescending(x => x.Version).FirstOrDefaultAsync(ct);
        if (template is null)
        {
            AddClarification(conversation, "effective-template", "گروه فاقد قالب معتبر است.");
            return;
        }

        var sourceContract = baseResult.Contract ?? new Contract
        {
            OrganizationId = tenant.OrganizationId, DocumentId = Guid.Empty,
            Subject = conversation.Subject, Currency = "IRR"
        };
        var changes = ContractChangeSetParser.Parse(instruction, sourceContract);
        if (changes.Questions.Count > 0)
        {
            foreach (var question in changes.Questions)
                AddClarification(conversation, $"input-{question.GetHashCode():X}", question);
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
            Conflicts = conflicts
        });
        var conflictJson = JsonSerializer.Serialize(conflicts);
        var templateFile = await files.DownloadAsync(template.FileId,
            CreateContractTemplateHandler.Bearer(context), ct);
        var partyName = await db.OrganizationParties.Where(x => x.Id == conversation.OrganizationPartyId)
            .Select(x => x.Name).SingleAsync(ct);
        var values = new Dictionary<string, string>
        {
            ["subject"] = conversation.Subject,
            ["contractNumber"] = sourceContract.ContractNumber ?? "",
            ["startDate"] = PersianDate.Format(changes.StartDate!.Value),
            ["endDate"] = PersianDate.Format(changes.EndDate!.Value),
            ["amount"] = changes.CalculatedAmount!.Value.ToString("N0"),
            ["currency"] = sourceContract.Currency,
            ["newClause"] = changes.NewClause ?? "",
            ["approvedClauses"] = string.Join("\n\n", approvedClauses.Select(x => $"{x.Code} - {x.Title}\n{x.Text}")),
            ["partyName"] = partyName
        };
        var generated = await generator.GenerateAsync(templateFile.Content, values, ct);
        var version = conversation.Drafts.Count == 0 ? 1 : conversation.Drafts.Max(x => x.VersionNumber) + 1;
        var pdf = await generator.GeneratePdfAsync(new ContractPdfRequest(
            conversation.Id, version, conversation.Subject, partyName,
            values["startDate"], values["endDate"], values["amount"], values["currency"],
            changes.NewClause, values["approvedClauses"], diff,
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
                .Include(x => x.GroupMemberships).SingleOrDefaultAsync(x =>
                    x.Id == conversation.BaseContractId && x.OrganizationId == tenant.OrganizationId, ct);
            var version = frozen?.Document?.Versions.SingleOrDefault(x =>
                x.Id == conversation.BaseDocumentVersionId
                && x.LifecycleStatus == DocumentVersionLifecycleStatus.Final && x.IsRagPublished);
            return frozen is null || version is null ? new(null, null, false)
                : new(frozen, version, false);
        }
        var candidates = await db.Contracts.AsNoTracking()
            .Include(x => x.Document).ThenInclude(x => x!.Versions)
            .Include(x => x.Parties).Include(x => x.GroupMemberships)
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
        return await ContractConversationMapper.LoadAsync(db, tenant.OrganizationId, conversation.Id, ct);
    }

    private async Task FinalizeAsync(ContractConversation conversation, ContractDraftVersion draft, CancellationToken ct)
    {
        var changeSet = JsonSerializer.Deserialize<ContractChangeSet>(draft.ChangeSetJson)
            ?? throw new InvalidOperationException("Invalid draft change set.");
        Contract contract;
        if (draft.BaseContractId.HasValue)
        {
            contract = await db.Contracts.Include(x => x.Document).ThenInclude(x => x!.Versions)
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
        contract.Amount = changeSet.CalculatedAmount ?? contract.Amount;
        contract.StartDate = changeSet.StartDate ?? contract.StartDate;
        contract.EndDate = changeSet.EndDate ?? contract.EndDate;
        contract.Status = ContractStatus.Approved;
        contract.UpdatedAtUtc = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(changeSet.NewClause))
            contract.Clauses.Add(new ContractClause
            {
                ClauseNumber = $"AI-{contract.Clauses.Count + 1}", Title = "بند پیشنهادی کاربر",
                Text = changeSet.NewClause, Order = contract.Clauses.Count + 1
            });
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
                docxFile.FileName, docxFile.Content, model, "group", [],
                [conversation.PrimaryContractGroupId.ToString()], false, ct);
            version.ExtractedText = processed.ExtractedText;
            if (!string.IsNullOrWhiteSpace(processed.ExtractedText))
            {
                await ai.PublishTextAsync(tenant.OrganizationId, contract.DocumentId, version.Id,
                    processed.ExtractedText, model, "group", [],
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
