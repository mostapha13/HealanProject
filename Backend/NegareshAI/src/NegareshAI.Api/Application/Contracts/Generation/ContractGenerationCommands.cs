using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Dates;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;

namespace NegareshAI.Api.Application.Contracts.Generation;

public sealed record CreateContractTemplateCommand(
    CreateContractTemplateRequest Request, Stream File, string FileName, string ContentType)
    : IRequest<ContractTemplateResponse>;
public sealed record ListContractTemplatesQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResponse<ContractTemplateResponse>>;
public sealed record GetEffectiveContractTemplateQuery(Guid ContractGroupId, DateOnly StartDate)
    : IRequest<EffectiveContractTemplateResponse>;
public sealed record UpdateContractTemplateCommand(Guid Id, UpdateContractTemplateRequest Request):IRequest<ContractTemplateResponse?>;
public sealed record DeleteContractTemplateCommand(Guid Id):IRequest<bool>;
public sealed record RestoreContractTemplateCommand(Guid Id):IRequest<bool>;
public sealed record StartContractGenerationCommand(StartContractGenerationRequest Request)
    : IRequest<ContractGenerationResponse?>;
public sealed record ReviewContractGenerationCommand(
    Guid Id, ReviewContractGenerationRequest Request) : IRequest<ContractGenerationResponse?>;
public sealed record GetContractGenerationQuery(Guid Id) : IRequest<ContractGenerationResponse?>;

public sealed class CreateContractTemplateHandler(
    NegareshDbContext db, ICurrentTenant tenant, IFileManagerClient files,
    IHttpContextAccessor context, IAuditWriter audit)
    : IRequestHandler<CreateContractTemplateCommand, ContractTemplateResponse>
{
    public async Task<ContractTemplateResponse> Handle(
        CreateContractTemplateCommand command, CancellationToken cancellationToken)
    {
        if (command.Request.EffectiveFrom > command.Request.EffectiveTo)
            throw new InvalidOperationException("Template effective range is invalid.");
        if (command.Request.ContractGroupId.HasValue && !await db.ContractGroups.AnyAsync(x =>
                x.Id == command.Request.ContractGroupId && x.OrganizationId == tenant.OrganizationId
                && x.IsActive, cancellationToken))
            throw new InvalidOperationException("Contract group is unavailable.");
        var version = await db.ContractTemplates.Where(item =>
                item.OrganizationId == tenant.OrganizationId &&
                item.Name == command.Request.Name.Trim())
            .MaxAsync(item => (int?)item.Version, cancellationToken) ?? 0;
        var fileId = await files.UploadAsync(command.File, command.FileName,
            command.ContentType, Bearer(context), cancellationToken);
        var template = new ContractTemplate
        {
            OrganizationId = tenant.OrganizationId,
            Name = command.Request.Name.Trim(),
            ContractType = command.Request.ContractType.Trim(),
            Description = command.Request.Description?.Trim(),
            ContractGroupId = command.Request.ContractGroupId,
            ContractYear = command.Request.ContractYear,
            EffectiveFrom = command.Request.EffectiveFrom,
            EffectiveTo = command.Request.EffectiveTo,
            FileId = fileId, Version = version + 1, CreatedByUserId = tenant.UserId
        };
        db.ContractTemplates.Add(template);
        audit.Add("contract-template.created", nameof(ContractTemplate), template.Id.ToString());
        await db.SaveChangesAsync(cancellationToken);
        return Map(template);
    }

    internal static string? Bearer(IHttpContextAccessor context) =>
        context.HttpContext?.Request.Headers.Authorization.ToString()
            .Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);
    internal static ContractTemplateResponse Map(ContractTemplate item) =>
        new(item.Id, item.Name, item.ContractType, item.Version, item.Description,
            item.IsActive, item.CreatedAtUtc, item.ContractGroupId, item.ContractYear,
            item.EffectiveFrom, item.EffectiveTo);
}
public sealed class GetEffectiveContractTemplateHandler(NegareshDbContext db,ICurrentTenant tenant)
    : IRequestHandler<GetEffectiveContractTemplateQuery,EffectiveContractTemplateResponse>
{
 public async Task<EffectiveContractTemplateResponse> Handle(GetEffectiveContractTemplateQuery q,CancellationToken ct){var x=await db.ContractTemplates.AsNoTracking().Where(x=>x.OrganizationId==tenant.OrganizationId&&x.ContractGroupId==q.ContractGroupId&&x.IsActive&&(x.EffectiveFrom==null||x.EffectiveFrom<=q.StartDate)&&(x.EffectiveTo==null||x.EffectiveTo>=q.StartDate)).OrderByDescending(x=>x.Version).FirstOrDefaultAsync(ct);return x is null?new(null,"گروه فاقد قالب معتبر است."):new(CreateContractTemplateHandler.Map(x),null);}
}
public sealed class UpdateContractTemplateHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<UpdateContractTemplateCommand,ContractTemplateResponse?>
{
 public async Task<ContractTemplateResponse?> Handle(UpdateContractTemplateCommand c,CancellationToken ct){var r=c.Request;var x=await db.ContractTemplates.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct);if(x is null||r.EffectiveFrom>r.EffectiveTo)return null;if(r.ContractGroupId.HasValue&&!await db.ContractGroups.AnyAsync(g=>g.Id==r.ContractGroupId&&g.OrganizationId==tenant.OrganizationId&&g.IsActive,ct))return null;x.Name=r.Name.Trim();x.ContractType=r.ContractType.Trim();x.Description=r.Description?.Trim();x.ContractGroupId=r.ContractGroupId;x.ContractYear=r.ContractYear;x.EffectiveFrom=r.EffectiveFrom;x.EffectiveTo=r.EffectiveTo;x.IsActive=r.IsActive;x.UpdatedAtUtc=DateTime.UtcNow;x.UpdatedByUserId=tenant.UserId;audit.Add("contract-template.updated",nameof(ContractTemplate),x.Id.ToString());await db.SaveChangesAsync(ct);return CreateContractTemplateHandler.Map(x);}
}
public sealed class DeleteContractTemplateHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<DeleteContractTemplateCommand,bool>{public async Task<bool> Handle(DeleteContractTemplateCommand c,CancellationToken ct){var x=await db.ContractTemplates.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct);if(x is null)return false;x.IsDeleted=true;x.IsActive=false;x.DeletedAtUtc=DateTime.UtcNow;x.DeletedByUserId=tenant.UserId;audit.Add("contract-template.deleted",nameof(ContractTemplate),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}
public sealed class RestoreContractTemplateHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<RestoreContractTemplateCommand,bool>{public async Task<bool> Handle(RestoreContractTemplateCommand c,CancellationToken ct){var x=await db.ContractTemplates.IgnoreQueryFilters().SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId&&x.IsDeleted,ct);if(x is null)return false;x.IsDeleted=false;x.IsActive=true;x.DeletedAtUtc=null;x.DeletedByUserId=null;x.UpdatedAtUtc=DateTime.UtcNow;x.UpdatedByUserId=tenant.UserId;audit.Add("contract-template.restored",nameof(ContractTemplate),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}

public sealed class ListContractTemplatesHandler(NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<ListContractTemplatesQuery, PagedResponse<ContractTemplateResponse>>
{
    public async Task<PagedResponse<ContractTemplateResponse>> Handle(
        ListContractTemplatesQuery request, CancellationToken cancellationToken) =>
        await db.ContractTemplates.AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId && item.IsActive)
            .OrderBy(item => item.Name).ThenByDescending(item => item.Version)
            .Select(item => new ContractTemplateResponse(item.Id, item.Name, item.ContractType,
                item.Version, item.Description, item.IsActive, item.CreatedAtUtc,
                item.ContractGroupId, item.ContractYear, item.EffectiveFrom, item.EffectiveTo))
            .ToPagedResponseAsync(
                new PageRequest(request.PageNumber, request.PageSize), cancellationToken);
}

public sealed class StartContractGenerationHandler(
    NegareshDbContext db, ICurrentTenant tenant, IFileManagerClient files,
    IContractDocumentGenerator generator, IHttpContextAccessor context, IAuditWriter audit)
    : IRequestHandler<StartContractGenerationCommand, ContractGenerationResponse?>
{
    public async Task<ContractGenerationResponse?> Handle(
        StartContractGenerationCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var contract = await db.Contracts.Include(item => item.Document)
            .ThenInclude(item => item!.Versions).Include(item => item.Parties)
            .SingleOrDefaultAsync(item => item.Id == request.ContractId &&
                item.OrganizationId == tenant.OrganizationId, cancellationToken);
        var template = await db.ContractTemplates.SingleOrDefaultAsync(item =>
            item.Id == request.ContractTemplateId &&
            item.OrganizationId == tenant.OrganizationId && item.IsActive, cancellationToken);
        var baseVersion = contract?.Document?.Versions.OrderByDescending(item => item.VersionNumber).FirstOrDefault();
        if (contract is null || template is null || baseVersion is null) return null;

        var allowedSources = await db.Documents.AsNoTracking().Where(item =>
                item.OrganizationId == tenant.OrganizationId &&
                (request.SourceDocumentIds ?? Array.Empty<Guid>()).Contains(item.Id))
            .Select(item => new { item.Id, item.Title,
                VersionId = item.Versions.OrderByDescending(v => v.VersionNumber).Select(v => v.Id).FirstOrDefault() })
            .ToListAsync(cancellationToken);
        var changes = ContractChangeSetParser.Parse(request.UserInstruction, contract);
        var changeSetJson = JsonSerializer.Serialize(changes);
        var sourceJson = JsonSerializer.Serialize(new {
            BaseDocumentId = contract.DocumentId, BaseVersionId = baseVersion.Id,
            TemplateId = template.Id, TemplateVersion = template.Version, Sources = allowedSources
        });
        var calculations = JsonSerializer.Serialize(new {
            OriginalAmount = contract.Amount, changes.IncreasePercent,
            changes.CalculatedAmount, Formula = changes.IncreasePercent.HasValue
                ? "originalAmount * (1 + increasePercent / 100)" : "explicitAmount"
        });
        var diff = JsonSerializer.Serialize(new {
            StartDate = new { Before = contract.StartDate, After = changes.StartDate ?? contract.StartDate },
            EndDate = new { Before = contract.EndDate, After = changes.EndDate ?? contract.EndDate },
            Amount = new { Before = contract.Amount, After = changes.CalculatedAmount ?? contract.Amount },
            AddedClause = changes.NewClause
        });
        var run = new ContractGenerationRun {
            OrganizationId = tenant.OrganizationId, ContractId = contract.Id,
            BaseDocumentVersionId = baseVersion.Id, ContractTemplateId = template.Id,
            UserInstruction = request.UserInstruction.Trim(), ChangeSetJson = changeSetJson,
            SourceSnapshotJson = sourceJson, CalculationSnapshotJson = calculations,
            DiffJson = diff, ClarificationQuestionsJson = changes.Questions.Count > 0
                ? JsonSerializer.Serialize(changes.Questions) : null,
            Status = changes.Questions.Count > 0 ? ContractGenerationStatus.NeedsClarification
                : ContractGenerationStatus.ReadyForReview,
            ModelId = "deterministic-fa-changeset+bge-m3-rag",
            PromptVersion = "contract-generation-v1", CreatedByUserId = tenant.UserId
        };
        if (run.Status == ContractGenerationStatus.ReadyForReview)
        {
            var templateFile = await files.DownloadAsync(template.FileId,
                CreateContractTemplateHandler.Bearer(context), cancellationToken);
            var values = new Dictionary<string, string> {
                ["subject"] = contract.Subject,
                ["contractNumber"] = contract.ContractNumber ?? "",
                ["startDate"] = PersianDate.Format(changes.StartDate ?? contract.StartDate!.Value),
                ["endDate"] = PersianDate.Format(changes.EndDate ?? contract.EndDate!.Value),
                ["amount"] = (changes.CalculatedAmount ?? contract.Amount!.Value).ToString("N0"),
                ["currency"] = contract.Currency,
                ["newClause"] = changes.NewClause ?? "",
                ["partyName"] = contract.Parties.FirstOrDefault()?.Name ?? ""
            };
            var generated = await generator.GenerateAsync(templateFile.Content, values, cancellationToken);
            await using var stream = new MemoryStream(generated);
            run.GeneratedDocxFileId = await files.UploadAsync(stream,
                $"contract-draft-{run.Id:N}.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                CreateContractTemplateHandler.Bearer(context), cancellationToken);
        }
        db.ContractGenerationRuns.Add(run);
        audit.Add("contract-generation.created", nameof(ContractGenerationRun), run.Id.ToString(), sourceJson);
        await db.SaveChangesAsync(cancellationToken);
        return Map(run);
    }

    internal static ContractGenerationResponse Map(ContractGenerationRun item) =>
        new(item.Id, item.ContractId, item.BaseDocumentVersionId, item.ContractTemplateId,
            item.UserInstruction, item.ChangeSetJson, item.SourceSnapshotJson,
            item.CalculationSnapshotJson, item.DiffJson, item.ClarificationQuestionsJson,
            item.Status, item.ModelId, item.PromptVersion, item.GeneratedDocxFileId,
            item.GeneratedPdfFileId, item.CreatedByUserId, item.ReviewedByUserId,
            item.ReviewComment, item.CreatedAtUtc, item.ReviewedAtUtc);
}

public sealed class GetContractGenerationHandler(NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<GetContractGenerationQuery, ContractGenerationResponse?>
{
    public async Task<ContractGenerationResponse?> Handle(GetContractGenerationQuery request,
        CancellationToken cancellationToken)
    {
        var item = await db.ContractGenerationRuns.AsNoTracking().SingleOrDefaultAsync(run =>
            run.Id == request.Id && run.OrganizationId == tenant.OrganizationId, cancellationToken);
        return item is null ? null : StartContractGenerationHandler.Map(item);
    }
}

public sealed class ReviewContractGenerationHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<ReviewContractGenerationCommand, ContractGenerationResponse?>
{
    public async Task<ContractGenerationResponse?> Handle(ReviewContractGenerationCommand command,
        CancellationToken cancellationToken)
    {
        var run = await db.ContractGenerationRuns.Include(item => item.Contract)
            .ThenInclude(item => item!.Document).ThenInclude(item => item!.Versions)
            .SingleOrDefaultAsync(item => item.Id == command.Id &&
                item.OrganizationId == tenant.OrganizationId, cancellationToken);
        if (run is null || run.Status != ContractGenerationStatus.ReadyForReview) return null;
        run.Status = command.Request.Approved ? ContractGenerationStatus.Approved
            : ContractGenerationStatus.Rejected;
        run.ReviewedByUserId = tenant.UserId;
        run.ReviewComment = command.Request.Comment?.Trim();
        run.ReviewedAtUtc = DateTime.UtcNow;
        if (command.Request.Approved && run.GeneratedDocxFileId is not null)
        {
            var next = run.Contract!.Document!.Versions.Max(item => item.VersionNumber) + 1;
            db.DocumentVersions.Add(new DocumentVersion {
                DocumentId = run.Contract.DocumentId, VersionNumber = next,
                FileId = run.GeneratedDocxFileId, CreatedByUserId = tenant.UserId,
                ChangeSummary = $"پیش‌نویس تأییدشده AI - اجرای {run.Id}"
            });
            run.Contract.Status = ContractStatus.Draft;
            run.Contract.UpdatedAtUtc = DateTime.UtcNow;
        }
        audit.Add(command.Request.Approved ? "contract-generation.approved" :
            "contract-generation.rejected", nameof(ContractGenerationRun), run.Id.ToString());
        await db.SaveChangesAsync(cancellationToken);
        return StartContractGenerationHandler.Map(run);
    }
}
