using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.MasterData;
public sealed record ListApprovedContractClausesQuery(Guid? ContractGroupId,int PageNumber=1,int PageSize=20):IRequest<PagedResponse<ApprovedContractClauseResponse>>;
public sealed record SaveApprovedContractClauseCommand(Guid? Id,SaveApprovedContractClauseRequest Request):IRequest<ApprovedContractClauseResponse?>;
public sealed record DeleteApprovedContractClauseCommand(Guid Id):IRequest<bool>;
public sealed record RestoreApprovedContractClauseCommand(Guid Id):IRequest<bool>;
public sealed class ListApprovedContractClausesHandler(NegareshDbContext db,ICurrentTenant tenant):IRequestHandler<ListApprovedContractClausesQuery,PagedResponse<ApprovedContractClauseResponse>>
{
 public Task<PagedResponse<ApprovedContractClauseResponse>> Handle(ListApprovedContractClausesQuery q,CancellationToken ct)=>db.ApprovedContractClauses.AsNoTracking().Where(x=>x.OrganizationId==tenant.OrganizationId&&(!q.ContractGroupId.HasValue||x.ContractGroupId==q.ContractGroupId)).OrderBy(x=>x.ContractGroup!.Name).ThenBy(x=>x.Order).Select(x=>new ApprovedContractClauseResponse(x.Id,x.ContractGroupId,x.ContractGroup!.Name,x.Code,x.Title,x.Text,x.Order,x.IsRequired,x.IsActive)).ToPagedResponseAsync(new PageRequest(q.PageNumber,q.PageSize),ct);
}
public sealed class SaveApprovedContractClauseHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<SaveApprovedContractClauseCommand,ApprovedContractClauseResponse?>
{
 public async Task<ApprovedContractClauseResponse?> Handle(SaveApprovedContractClauseCommand c,CancellationToken ct){var r=c.Request;if(string.IsNullOrWhiteSpace(r.Code)||string.IsNullOrWhiteSpace(r.Title)||string.IsNullOrWhiteSpace(r.Text)||r.Order<0)return null;var group=await db.ContractGroups.SingleOrDefaultAsync(x=>x.Id==r.ContractGroupId&&x.OrganizationId==tenant.OrganizationId&&x.IsActive,ct);if(group is null)return null;var x=c.Id.HasValue?await db.ApprovedContractClauses.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct):null;if(c.Id.HasValue&&x is null)return null;x??=new ApprovedContractClause{OrganizationId=tenant.OrganizationId,ContractGroupId=group.Id,Code="",Title="",Text="",CreatedByUserId=tenant.UserId};x.ContractGroupId=group.Id;x.Code=r.Code.Trim();x.Title=r.Title.Trim();x.Text=r.Text.Trim();x.Order=r.Order;x.IsRequired=r.IsRequired;x.IsActive=r.IsActive;if(c.Id.HasValue){x.UpdatedAtUtc=DateTime.UtcNow;x.UpdatedByUserId=tenant.UserId;}else db.ApprovedContractClauses.Add(x);audit.Add(c.Id.HasValue?"approved-clause.updated":"approved-clause.created",nameof(ApprovedContractClause),x.Id.ToString());await db.SaveChangesAsync(ct);return new(x.Id,x.ContractGroupId,group.Name,x.Code,x.Title,x.Text,x.Order,x.IsRequired,x.IsActive);}
}
public sealed class DeleteApprovedContractClauseHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<DeleteApprovedContractClauseCommand,bool>{public async Task<bool> Handle(DeleteApprovedContractClauseCommand c,CancellationToken ct){var x=await db.ApprovedContractClauses.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct);if(x is null)return false;x.IsDeleted=true;x.IsActive=false;x.DeletedAtUtc=DateTime.UtcNow;x.DeletedByUserId=tenant.UserId;audit.Add("approved-clause.deleted",nameof(ApprovedContractClause),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}
public sealed class RestoreApprovedContractClauseHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<RestoreApprovedContractClauseCommand,bool>{public async Task<bool> Handle(RestoreApprovedContractClauseCommand c,CancellationToken ct){var x=await db.ApprovedContractClauses.IgnoreQueryFilters().SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId&&x.IsDeleted,ct);if(x is null)return false;x.IsDeleted=false;x.IsActive=true;x.DeletedAtUtc=null;x.DeletedByUserId=null;x.UpdatedAtUtc=DateTime.UtcNow;x.UpdatedByUserId=tenant.UserId;audit.Add("approved-clause.restored",nameof(ApprovedContractClause),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}
