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
        return new(group.Id, group.Name, group.Description, group.IsActive,
            documentIds, group.CreatedAtUtc);
    }
}

public sealed record CreateRuleSetCommand(CreateRuleSetRequest Request)
    : IRequest<RuleSetResponse?>;

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
