using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.MasterData;
public sealed record ListComplianceCriteriaQuery(int PageNumber=1,int PageSize=20):IRequest<PagedResponse<ComplianceCriterionResponse>>;
public sealed record SaveComplianceCriterionCommand(Guid? Id,SaveComplianceCriterionRequest Request):IRequest<ComplianceCriterionResponse?>;
public sealed record DeleteComplianceCriterionCommand(Guid Id):IRequest<bool>;
public sealed record RestoreComplianceCriterionCommand(Guid Id):IRequest<bool>;
public sealed class ListComplianceCriteriaHandler(NegareshDbContext db,ICurrentTenant tenant):IRequestHandler<ListComplianceCriteriaQuery,PagedResponse<ComplianceCriterionResponse>>{
 public Task<PagedResponse<ComplianceCriterionResponse>> Handle(ListComplianceCriteriaQuery q,CancellationToken ct)=>db.ComplianceCriteria.AsNoTracking().Where(x=>x.OrganizationId==tenant.OrganizationId).OrderBy(x=>x.Code).Select(x=>new ComplianceCriterionResponse(x.Id,x.Code,x.Title,x.Description,x.DefaultWeight,x.IsCriticalByDefault,x.IsActive)).ToPagedResponseAsync(new PageRequest(q.PageNumber,q.PageSize),ct);
}
public sealed class SaveComplianceCriterionHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<SaveComplianceCriterionCommand,ComplianceCriterionResponse?>{
 public async Task<ComplianceCriterionResponse?> Handle(SaveComplianceCriterionCommand c,CancellationToken ct){var r=c.Request;if(string.IsNullOrWhiteSpace(r.Code)||string.IsNullOrWhiteSpace(r.Title)||r.DefaultWeight<0)return null;var x=c.Id.HasValue?await db.ComplianceCriteria.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct):null;if(c.Id.HasValue&&x is null)return null;x??=new ComplianceCriterion{OrganizationId=tenant.OrganizationId,Code="",Title="",CreatedByUserId=tenant.UserId};x.Code=r.Code.Trim();x.Title=r.Title.Trim();x.Description=r.Description?.Trim();x.DefaultWeight=r.DefaultWeight;x.IsCriticalByDefault=r.IsCriticalByDefault;x.IsActive=r.IsActive;if(c.Id.HasValue){x.UpdatedAtUtc=DateTime.UtcNow;x.UpdatedByUserId=tenant.UserId;}else db.ComplianceCriteria.Add(x);audit.Add(c.Id.HasValue?"criterion.updated":"criterion.created",nameof(ComplianceCriterion),x.Id.ToString());await db.SaveChangesAsync(ct);return new(x.Id,x.Code,x.Title,x.Description,x.DefaultWeight,x.IsCriticalByDefault,x.IsActive);}
}
public sealed class DeleteComplianceCriterionHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<DeleteComplianceCriterionCommand,bool>{public async Task<bool> Handle(DeleteComplianceCriterionCommand c,CancellationToken ct){var x=await db.ComplianceCriteria.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct);if(x is null)return false;x.IsDeleted=true;x.IsActive=false;x.DeletedAtUtc=DateTime.UtcNow;x.DeletedByUserId=tenant.UserId;audit.Add("criterion.deleted",nameof(ComplianceCriterion),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}
public sealed class RestoreComplianceCriterionHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<RestoreComplianceCriterionCommand,bool>{public async Task<bool> Handle(RestoreComplianceCriterionCommand c,CancellationToken ct){var x=await db.ComplianceCriteria.IgnoreQueryFilters().SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId&&x.IsDeleted,ct);if(x is null)return false;x.IsDeleted=false;x.IsActive=true;x.DeletedAtUtc=null;x.DeletedByUserId=null;x.UpdatedAtUtc=DateTime.UtcNow;x.UpdatedByUserId=tenant.UserId;audit.Add("criterion.restored",nameof(ComplianceCriterion),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}
