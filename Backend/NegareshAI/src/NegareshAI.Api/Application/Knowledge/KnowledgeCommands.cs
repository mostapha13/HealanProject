using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Knowledge;

public sealed record CreateDocumentGroupCommand(CreateDocumentGroupRequest Request)
    : IRequest<DocumentGroupResponse?>;
public sealed record UpdateDocumentGroupCommand(Guid Id, UpdateDocumentGroupRequest Request)
    : IRequest<DocumentGroupResponse?>;
public sealed record DeleteDocumentGroupCommand(Guid Id) : IRequest<bool>;
public sealed record RestoreDocumentGroupCommand(Guid Id):IRequest<bool>;

public sealed class CreateDocumentGroupCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<CreateDocumentGroupCommand, DocumentGroupResponse?>
{
    public async Task<DocumentGroupResponse?> Handle(
        CreateDocumentGroupCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var documentIds = request.DocumentIds.Distinct().ToArray();
        var ownedCount = await db.Documents.CountAsync(item =>
            item.OrganizationId == tenant.OrganizationId && documentIds.Contains(item.Id),
            cancellationToken);
        if (ownedCount != documentIds.Length)
            return null;

        var group = new DocumentGroup
        {
            OrganizationId = tenant.OrganizationId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            PassingThreshold = UpdateDocumentGroupCommandHandler.ValidThreshold(request.PassingThreshold),
            CreatedByUserId = tenant.UserId,
            Members = documentIds.Select(documentId => new DocumentGroupMember
            {
                DocumentId = documentId
            }).ToList()
        };
        db.DocumentGroups.Add(group);
        audit.Add("document-group.created", nameof(DocumentGroup), group.Id.ToString(),
            new { documentCount = documentIds.Length });
        await db.SaveChangesAsync(cancellationToken);
        return new(group.Id, group.Name, group.Description, group.PassingThreshold, group.IsActive,
            documentIds, group.CreatedAtUtc);
    }
}

public sealed class UpdateDocumentGroupCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<UpdateDocumentGroupCommand, DocumentGroupResponse?>
{
    public static decimal ValidThreshold(decimal value)
    {
        if (value is <= 0 or > 100)
            throw new ArgumentOutOfRangeException(nameof(value), "Passing threshold must be between 0 and 100.");
        return decimal.Round(value, 2);
    }

    public async Task<DocumentGroupResponse?> Handle(UpdateDocumentGroupCommand command, CancellationToken ct)
    {
        var group = await db.DocumentGroups.Include(x => x.Members).SingleOrDefaultAsync(x =>
            x.Id == command.Id && x.OrganizationId == tenant.OrganizationId, ct);
        if (group is null || string.IsNullOrWhiteSpace(command.Request.Name)) return null;
        var ids = command.Request.DocumentIds.Distinct().ToArray();
        if (ids.Length != await db.Documents.CountAsync(x => x.OrganizationId == tenant.OrganizationId && ids.Contains(x.Id), ct)) return null;
        db.DocumentGroupMembers.RemoveRange(group.Members); group.Members.Clear();
        group.Members.AddRange(ids.Select(id => new DocumentGroupMember { DocumentId = id }));
        group.Name = command.Request.Name.Trim(); group.Description = command.Request.Description?.Trim(); group.IsActive = command.Request.IsActive;
        group.PassingThreshold = ValidThreshold(command.Request.PassingThreshold);
        group.UpdatedAtUtc = DateTime.UtcNow; group.UpdatedByUserId = tenant.UserId;
        audit.Add("document-group.updated", nameof(DocumentGroup), group.Id.ToString()); await db.SaveChangesAsync(ct);
        return new(group.Id, group.Name, group.Description, group.PassingThreshold, group.IsActive, ids, group.CreatedAtUtc);
    }
}
public sealed class DeleteDocumentGroupCommandHandler(NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<DeleteDocumentGroupCommand, bool>
{
    public async Task<bool> Handle(DeleteDocumentGroupCommand command, CancellationToken ct)
    {
        var group = await db.DocumentGroups.SingleOrDefaultAsync(x => x.Id == command.Id && x.OrganizationId == tenant.OrganizationId, ct);
        if (group is null) return false;
        group.IsDeleted = true; group.IsActive = false; group.DeletedAtUtc = DateTime.UtcNow; group.DeletedByUserId = tenant.UserId;
        audit.Add("document-group.deleted", nameof(DocumentGroup), group.Id.ToString()); await db.SaveChangesAsync(ct); return true;
    }
}
public sealed class RestoreDocumentGroupCommandHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<RestoreDocumentGroupCommand,bool>{public async Task<bool> Handle(RestoreDocumentGroupCommand c,CancellationToken ct){var x=await db.DocumentGroups.IgnoreQueryFilters().SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId&&x.IsDeleted,ct);if(x is null)return false;x.IsDeleted=false;x.IsActive=true;x.DeletedAtUtc=null;x.DeletedByUserId=null;x.UpdatedAtUtc=DateTime.UtcNow;x.UpdatedByUserId=tenant.UserId;audit.Add("document-group.restored",nameof(DocumentGroup),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}

public sealed record CreateRuleSetCommand(CreateRuleSetRequest Request)
    : IRequest<RuleSetResponse?>;
public sealed record SetRuleSetActiveCommand(Guid Id,bool IsActive):IRequest<bool>;
public sealed record DeleteRuleSetCommand(Guid Id):IRequest<bool>;
public sealed record RestoreRuleSetCommand(Guid Id):IRequest<bool>;

public sealed class CreateRuleSetCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<CreateRuleSetCommand, RuleSetResponse?>
{
    public async Task<RuleSetResponse?> Handle(
        CreateRuleSetCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        if (request.EffectiveToUtc is not null
            && request.EffectiveToUtc <= request.EffectiveFromUtc)
            throw new ArgumentException("EffectiveToUtc must be after EffectiveFromUtc.");

        if (request.DocumentGroupId is not null
            && !await db.DocumentGroups.AnyAsync(item =>
                item.Id == request.DocumentGroupId
                && item.OrganizationId == tenant.OrganizationId, cancellationToken))
            return null;

        foreach (var parameter in request.Rules.SelectMany(item => item.Parameters))
            using (JsonDocument.Parse(parameter.ValueJson)) { }

        var previousVersion = await db.RuleSets
            .Where(item => item.OrganizationId == tenant.OrganizationId
                && item.Name == request.Name.Trim())
            .MaxAsync(item => (int?)item.Version, cancellationToken) ?? 0;
        var ruleSet = new RuleSet
        {
            OrganizationId = tenant.OrganizationId,
            DocumentGroupId = request.DocumentGroupId,
            Name = request.Name.Trim(),
            Version = previousVersion + 1,
            EffectiveFromUtc = request.EffectiveFromUtc ?? DateTime.UtcNow,
            EffectiveToUtc = request.EffectiveToUtc,
            CreatedByUserId = tenant.UserId,
            Rules = request.Rules.Select(item => new Rule
            {
                Code = item.Code.Trim(),
                Title = item.Title.Trim(),
                Instruction = item.Instruction.Trim(),
                Severity = Math.Clamp(item.Severity, 1, 5),
                Order = item.Order,
                Parameters = item.Parameters.Select(parameter => new RuleParameter
                {
                    Key = parameter.Key.Trim(),
                    ValueJson = parameter.ValueJson
                }).ToList()
            }).ToList()
        };
        db.RuleSets.Add(ruleSet);
        audit.Add("rule-set.created", nameof(RuleSet), ruleSet.Id.ToString(),
            new { ruleSet.Name, ruleSet.Version, ruleCount = ruleSet.Rules.Count });
        await db.SaveChangesAsync(cancellationToken);
        return KnowledgeMapping.ToResponse(ruleSet);
    }
}
public sealed class SetRuleSetActiveHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<SetRuleSetActiveCommand,bool>{public async Task<bool> Handle(SetRuleSetActiveCommand c,CancellationToken ct){var x=await db.RuleSets.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct);if(x is null)return false;x.IsActive=c.IsActive;x.UpdatedAtUtc=DateTime.UtcNow;x.UpdatedByUserId=tenant.UserId;audit.Add("rule-set.active.changed",nameof(RuleSet),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}
public sealed class DeleteRuleSetHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<DeleteRuleSetCommand,bool>{public async Task<bool> Handle(DeleteRuleSetCommand c,CancellationToken ct){var x=await db.RuleSets.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct);if(x is null)return false;x.IsDeleted=true;x.IsActive=false;x.DeletedAtUtc=DateTime.UtcNow;x.DeletedByUserId=tenant.UserId;audit.Add("rule-set.deleted",nameof(RuleSet),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}
public sealed class RestoreRuleSetHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<RestoreRuleSetCommand,bool>{public async Task<bool> Handle(RestoreRuleSetCommand c,CancellationToken ct){var x=await db.RuleSets.IgnoreQueryFilters().SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId&&x.IsDeleted,ct);if(x is null)return false;x.IsDeleted=false;x.IsActive=true;x.DeletedAtUtc=null;x.DeletedByUserId=null;x.UpdatedAtUtc=DateTime.UtcNow;x.UpdatedByUserId=tenant.UserId;audit.Add("rule-set.restored",nameof(RuleSet),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}

internal static class KnowledgeMapping
{
    public static RuleSetResponse ToResponse(RuleSet item) =>
        new(item.Id, item.Name, item.Version, item.DocumentGroupId,
            item.EffectiveFromUtc, item.EffectiveToUtc, item.IsActive,
            item.Rules.OrderBy(rule => rule.Order).Select(rule =>
                new RuleResponse(rule.Id, rule.Code, rule.Title, rule.Instruction,
                    rule.Severity, rule.Order, rule.IsActive,
                    rule.Parameters.Select(parameter =>
                        new RuleParameterResponse(
                            parameter.Id, parameter.Key, parameter.ValueJson)).ToArray()))
                .ToArray());
}
