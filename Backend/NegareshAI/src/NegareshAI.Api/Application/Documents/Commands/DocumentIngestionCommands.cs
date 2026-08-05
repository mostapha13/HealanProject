using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record IngestionFile(IFormFile File, int SortOrder, int? PageNumber);

public sealed record UploadDocumentBatchCommand(
    IReadOnlyList<IngestionFile> Files, string Title, string DocumentType,
    ConfidentialityLevel ConfidentialityLevel, IReadOnlyList<Guid> DocumentGroupIds,
    string? BearerToken)
    : IRequest<DocumentDetailResponse>;

public sealed class UploadDocumentBatchCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IFileManagerClient files,
    IAiDocumentProcessor ai, IAuditWriter audit, IDataScopeAuthorizer? authorizer = null)
    : IRequestHandler<UploadDocumentBatchCommand, DocumentDetailResponse>
{
    public async Task<DocumentDetailResponse> Handle(
        UploadDocumentBatchCommand request, CancellationToken ct)
    {
        var groupIds = request.DocumentGroupIds.Distinct().ToArray();
        if (groupIds.Length == 0) throw new InvalidOperationException("At least one document group is required.");
        var validGroupCount = await db.DocumentGroups.CountAsync(x => groupIds.Contains(x.Id)
            && x.OrganizationId == tenant.OrganizationId && x.IsActive, ct);
        if (validGroupCount != groupIds.Length) throw new InvalidOperationException("An invalid document group was selected.");
        if (authorizer is not null)
            foreach (var groupId in groupIds)
                if (!await authorizer.CanAccessAsync(DataScopeResourceType.DocumentGroup, groupId, ct))
                    throw new UnauthorizedAccessException("Document group access is denied.");
        var model = await DocumentIngestionSupport.GetEmbeddingModelAsync(db, tenant.OrganizationId, ct);
        var document = new Document
        {
            OrganizationId = tenant.OrganizationId, OwnerUserId = tenant.UserId,
            Title = request.Title.Trim(), DocumentType = request.DocumentType.Trim(),
            ConfidentialityLevel = request.ConfidentialityLevel,
            ProcessingStatus = DocumentProcessingStatus.Processing
        };
        var version = new DocumentVersion
        {
            DocumentId = document.Id, VersionNumber = 1, FileId = "pending",
            CreatedByUserId = tenant.UserId
        };
        document.Versions.Add(version);
        var extractedPages = new SortedDictionary<int, string>();
        var extractionRows = new List<object>();

        foreach (var input in request.Files.OrderBy(x => x.SortOrder))
        {
            await using var source = input.File.OpenReadStream();
            using var buffer = new MemoryStream();
            await source.CopyToAsync(buffer, ct);
            var content = buffer.ToArray();
            var sha = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
            await using var upload = new MemoryStream(content, writable: false);
            var fileId = await files.UploadAsync(upload, input.File.FileName,
                input.File.ContentType, request.BearerToken, ct);
            if (version.FileId == "pending") version.FileId = fileId;
            version.Files.Add(new DocumentVersionFile
            {
                DocumentVersionId = version.Id, FileId = fileId,
                FileName = input.File.FileName, ContentType = input.File.ContentType,
                SortOrder = input.SortOrder, PageNumber = input.PageNumber,
                Sha256 = sha, Size = input.File.Length
            });
            var result = await ai.ProcessAsync(
                tenant.OrganizationId, document.Id, version.Id, input.File.FileName,
                content, model, "restricted", [tenant.UserId], [], false, ct);
            var texts = (result.ExtractedText ?? string.Empty).Split('\f');
            for (var index = 0; index < texts.Length; index++)
            {
                var page = input.PageNumber ?? (extractedPages.Count + 1);
                extractedPages[page + index] = texts[index];
            }
            extractionRows.Add(new
            {
                input.File.FileName, input.PageNumber, result.PageCount,
                result.Characters, result.OcrPageCount, sha
            });
        }

        version.ExtractedText = string.Join("\f", extractedPages.OrderBy(x => x.Key).Select(x => x.Value));
        version.ExtractedFieldsJson = DocumentIngestionSupport.SuggestFields(version.ExtractedText);
        version.ExtractionMetadataJson = JsonSerializer.Serialize(new { files = extractionRows, embeddingModel = model });
        version.LifecycleStatus = DocumentVersionLifecycleStatus.Extracted;
        document.ProcessingStatus = DocumentProcessingStatus.Ready;
        document.UpdatedAtUtc = DateTime.UtcNow;
        if (!await db.OrganizationMemberships.AnyAsync(x =>
                x.OrganizationId == tenant.OrganizationId && x.UserId == tenant.UserId, ct))
            db.OrganizationMemberships.Add(new OrganizationMembership
            { OrganizationId = tenant.OrganizationId, UserId = tenant.UserId });
        db.Documents.Add(document);
        db.DocumentGroupMembers.AddRange(groupIds.Select(groupId => new DocumentGroupMember
        { DocumentGroupId = groupId, DocumentId = document.Id }));
        audit.Add("document.ingestion-extracted", nameof(Document), document.Id.ToString(),
            new { version.Id, Files = request.Files.Count, RagPublished = false });
        await db.SaveChangesAsync(ct);
        return DocumentIngestionSupport.ToDetail(document);
    }
}

public sealed record SaveExtractedFieldsCommand(
    Guid DocumentId, Guid VersionId, string ExtractedFieldsJson)
    : IRequest<DocumentDetailResponse?>;

public sealed class SaveExtractedFieldsCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<SaveExtractedFieldsCommand, DocumentDetailResponse?>
{
    public async Task<DocumentDetailResponse?> Handle(SaveExtractedFieldsCommand request, CancellationToken ct)
    {
        using var parsed = JsonDocument.Parse(request.ExtractedFieldsJson);
        var document = await DocumentIngestionSupport.LoadAsync(db, tenant.OrganizationId, request.DocumentId, ct);
        var version = document?.Versions.SingleOrDefault(x => x.Id == request.VersionId);
        if (document is null || version is null || version.LifecycleStatus is
            DocumentVersionLifecycleStatus.Final or DocumentVersionLifecycleStatus.Superseded) return null;
        version.ExtractedFieldsJson = parsed.RootElement.GetRawText();
        version.LifecycleStatus = DocumentVersionLifecycleStatus.ExpertReview;
        document.UpdatedAtUtc = DateTime.UtcNow;
        audit.Add("document.extracted-fields-reviewed", nameof(DocumentVersion), version.Id.ToString());
        await db.SaveChangesAsync(ct);
        return DocumentIngestionSupport.ToDetail(document);
    }
}

public sealed record ExpertReviewDocumentVersionCommand(
    Guid DocumentId, Guid VersionId, bool Approved, string? Note)
    : IRequest<DocumentDetailResponse?>;

public sealed class ExpertReviewDocumentVersionCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit,
    IDataScopeAuthorizer? authorizer = null)
    : IRequestHandler<ExpertReviewDocumentVersionCommand, DocumentDetailResponse?>
{
    public async Task<DocumentDetailResponse?> Handle(ExpertReviewDocumentVersionCommand request, CancellationToken ct)
    {
        var document = await DocumentIngestionSupport.LoadAsync(db, tenant.OrganizationId, request.DocumentId, ct);
        var version = document?.Versions.SingleOrDefault(x => x.Id == request.VersionId);
        if (document is null || version is null || version.LifecycleStatus is not
            (DocumentVersionLifecycleStatus.Extracted or DocumentVersionLifecycleStatus.ExpertReview or DocumentVersionLifecycleStatus.Rejected)) return null;
        if (!await DocumentIngestionSupport.HasDocumentGroupAccessAsync(
                db, tenant.OrganizationId, request.DocumentId, authorizer, ct)) return null;
        version.ExpertReviewedByUserId = tenant.UserId;
        version.ExpertReviewedAtUtc = DateTime.UtcNow;
        version.ExpertReviewNote = request.Note?.Trim();
        version.LifecycleStatus = request.Approved
            ? DocumentVersionLifecycleStatus.ManagerReview
            : DocumentVersionLifecycleStatus.Rejected;
        document.UpdatedAtUtc = DateTime.UtcNow;
        audit.Add(request.Approved ? "document.expert-approved" : "document.expert-rejected",
            nameof(DocumentVersion), version.Id.ToString(), new { request.Note });
        await db.SaveChangesAsync(ct);
        return DocumentIngestionSupport.ToDetail(document);
    }
}

public sealed record ManagerReviewDocumentVersionCommand(
    Guid DocumentId, Guid VersionId, bool Approved, string? Note)
    : IRequest<DocumentDetailResponse?>;

public sealed class ManagerReviewDocumentVersionCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAiDocumentProcessor ai, IAuditWriter audit,
    IDataScopeAuthorizer? authorizer = null)
    : IRequestHandler<ManagerReviewDocumentVersionCommand, DocumentDetailResponse?>
{
    public async Task<DocumentDetailResponse?> Handle(ManagerReviewDocumentVersionCommand request, CancellationToken ct)
    {
        var document = await DocumentIngestionSupport.LoadAsync(db, tenant.OrganizationId, request.DocumentId, ct);
        var version = document?.Versions.SingleOrDefault(x => x.Id == request.VersionId);
        if (document is null || version is null || version.LifecycleStatus != DocumentVersionLifecycleStatus.ManagerReview) return null;
        if (!await DocumentIngestionSupport.HasDocumentGroupAccessAsync(
                db, tenant.OrganizationId, request.DocumentId, authorizer, ct)) return null;
        version.ManagerReviewedByUserId = tenant.UserId;
        version.ManagerReviewedAtUtc = DateTime.UtcNow;
        version.ManagerReviewNote = request.Note?.Trim();
        if (!request.Approved)
        {
            version.LifecycleStatus = DocumentVersionLifecycleStatus.Rejected;
            audit.Add("document.manager-rejected", nameof(DocumentVersion), version.Id.ToString(), new { request.Note });
            await db.SaveChangesAsync(ct);
            return DocumentIngestionSupport.ToDetail(document);
        }
        if (string.IsNullOrWhiteSpace(version.ExtractedText))
            throw new InvalidOperationException("Extracted text is required before finalization.");
        var model = await DocumentIngestionSupport.GetEmbeddingModelAsync(db, tenant.OrganizationId, ct);
        var groupIds = await db.DocumentGroupMembers.AsNoTracking()
            .Where(x => x.DocumentId == document.Id && x.DocumentGroup!.OrganizationId == tenant.OrganizationId
                && x.DocumentGroup.IsActive)
            .Select(x => x.DocumentGroupId.ToString()).ToListAsync(ct);
        var previousFinals = document.Versions.Where(x => x.Id != version.Id && x.IsRagPublished).ToList();
        await ai.PublishTextAsync(tenant.OrganizationId, document.Id, version.Id,
            version.ExtractedText, model,
            document.ConfidentialityLevel == ConfidentialityLevel.Internal ? "organization" : "restricted",
            string.IsNullOrWhiteSpace(document.OwnerUserId) ? [] : [document.OwnerUserId], groupIds, ct);
        foreach (var previous in previousFinals)
        {
            await ai.DeleteVersionAsync(tenant.OrganizationId, document.Id, previous.Id, model, ct);
            previous.IsRagPublished = false;
            previous.LifecycleStatus = DocumentVersionLifecycleStatus.Superseded;
        }
        version.LifecycleStatus = DocumentVersionLifecycleStatus.Final;
        version.IsRagPublished = true;
        version.RagPublishedAtUtc = DateTime.UtcNow;
        document.UpdatedAtUtc = DateTime.UtcNow;
        var comparisonRuns = await db.ComparisonRuns.Where(x =>
            x.OrganizationId == tenant.OrganizationId
            && x.TargetVersionId == version.Id
            && x.ApprovalStatus == ComparisonApprovalStatus.ExpertApproved)
            .ToListAsync(ct);
        foreach (var comparisonRun in comparisonRuns)
            comparisonRun.ApprovalStatus = ComparisonApprovalStatus.ManagerFinalized;
        audit.Add("document.manager-finalized-rag", nameof(DocumentVersion), version.Id.ToString(),
            new { request.Note, GroupIds = groupIds, Superseded = previousFinals.Select(x => x.Id),
                ComparisonRuns = comparisonRuns.Select(x => x.Id) });
        await db.SaveChangesAsync(ct);
        return DocumentIngestionSupport.ToDetail(document);
    }
}

internal static class DocumentIngestionSupport
{
    public static async Task<bool> HasDocumentGroupAccessAsync(
        NegareshDbContext db, Guid organizationId, Guid documentId,
        IDataScopeAuthorizer? authorizer, CancellationToken ct)
    {
        if (authorizer is null) return true;
        var groups = await db.DocumentGroupMembers.AsNoTracking().Where(x =>
            x.DocumentId == documentId && x.DocumentGroup!.OrganizationId == organizationId)
            .Select(x => x.DocumentGroupId).ToListAsync(ct);
        if (groups.Count == 0) return false;
        foreach (var group in groups)
            if (await authorizer.CanAccessAsync(DataScopeResourceType.DocumentGroup, group, ct)) return true;
        return false;
    }

    public static Task<Document?> LoadAsync(NegareshDbContext db, Guid organizationId, Guid documentId, CancellationToken ct) =>
        db.Documents.Include(x => x.Versions).ThenInclude(x => x.Files)
            .SingleOrDefaultAsync(x => x.Id == documentId && x.OrganizationId == organizationId, ct);

    public static async Task<string> GetEmbeddingModelAsync(NegareshDbContext db, Guid organizationId, CancellationToken ct)
    {
        var json = await db.RuntimeSettings.AsNoTracking().Where(x => x.OrganizationId == organizationId
            && x.Category == "ai" && x.Key == "embedding.model" && x.IsActive)
            .Select(x => x.ValueJson).SingleOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Active runtime setting ai/embedding.model is required.");
        using var parsed = JsonDocument.Parse(json);
        return parsed.RootElement.GetProperty("modelId").GetString()
            ?? throw new InvalidOperationException("embedding.model must contain modelId.");
    }

    public static string SuggestFields(string text)
    {
        var dates = Regex.Matches(text, @"(?:13|14)\d{2}[/\-.](?:0?[1-9]|1[0-2])[/\-.](?:0?[1-9]|[12]\d|3[01])")
            .Select(x => x.Value).Distinct().Take(20).ToArray();
        var years = Regex.Matches(text, @"(?<!\d)(?:13|14)\d{2}(?!\d)")
            .Select(x => x.Value).Distinct().Take(10).ToArray();
        var amounts = Regex.Matches(text, @"\d{1,3}(?:[,٬]\d{3}){2,}")
            .Select(x => x.Value).Distinct().Take(20).ToArray();
        var contractNumbers = Regex.Matches(text,
                @"(?:شماره\s*(?:قرارداد)?|قرارداد\s*شماره)\s*[:：-]?\s*([\p{L}\p{N}/_.-]{2,40})",
                RegexOptions.IgnoreCase)
            .Select(x => x.Groups[1].Value).Distinct().Take(10).ToArray();
        var companies = Regex.Matches(text,
                @"(?:شرکت|مؤسسه|موسسه|سازمان)\s+([\p{L}\p{N}\s‌-]{2,80})")
            .Select(x => x.Groups[0].Value.Trim())
            .Select(x => Regex.Split(x, @"[\r\n،؛,.]| {3,}")[0].Trim())
            .Where(x => x.Length is >= 4 and <= 100).Distinct().Take(20).ToArray();
        var clauseHeadings = Regex.Matches(text,
                @"(?m)^\s*((?:ماده|بند|تبصره|فصل)\s*[\p{N}۰-۹]+[^\r\n]{0,100})")
            .Select(x => x.Groups[1].Value.Trim()).Distinct().Take(50).ToArray();
        return JsonSerializer.Serialize(new
        {
            years, dates, amounts, contractNumbers,
            companyAndPartyCandidates = companies,
            clauseHeadings
        });
    }

    public static DocumentDetailResponse ToDetail(Document document) => new(
        document.Id, document.OrganizationId, document.Title, document.DocumentType,
        document.ConfidentialityLevel, document.ProcessingStatus, document.IsDeleted,
        document.CreatedAtUtc, document.UpdatedAtUtc,
        document.Versions.OrderByDescending(x => x.VersionNumber).Select(ToVersion).ToList());

    public static DocumentVersionResponse ToVersion(DocumentVersion version) => new(
        version.Id, version.VersionNumber, version.FileId, version.ChangeSummary,
        version.CreatedByUserId, version.CreatedAtUtc, version.LifecycleStatus,
        version.ExtractedText, version.ExtractedFieldsJson, version.ExtractionMetadataJson,
        version.ExpertReviewedByUserId, version.ExpertReviewedAtUtc, version.ExpertReviewNote,
        version.ManagerReviewedByUserId, version.ManagerReviewedAtUtc, version.ManagerReviewNote,
        version.IsRagPublished, version.RagPublishedAtUtc,
        version.Files.OrderBy(x => x.SortOrder).Select(x => new DocumentVersionFileResponse(
            x.Id, x.FileId, x.FileName, x.ContentType, x.SortOrder, x.PageNumber, x.Sha256, x.Size)).ToList());
}
