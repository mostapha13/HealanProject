using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
namespace NegareshAI.Api.Application.MasterData;
public sealed record ListGoldenDocumentsQuery(Guid? GroupId,int PageNumber=1,int PageSize=20):IRequest<PagedResponse<GoldenDocumentResponse>>;
public sealed record SaveGoldenDocumentCommand(Guid? Id,SaveGoldenDocumentRequest Request):IRequest<GoldenDocumentResponse?>;
public sealed record DeleteGoldenDocumentCommand(Guid Id):IRequest<bool>;
public sealed record RestoreGoldenDocumentCommand(Guid Id):IRequest<bool>;
public sealed class ListGoldenDocumentsHandler(NegareshDbContext db,ICurrentTenant tenant):IRequestHandler<ListGoldenDocumentsQuery,PagedResponse<GoldenDocumentResponse>>{public Task<PagedResponse<GoldenDocumentResponse>> Handle(ListGoldenDocumentsQuery q,CancellationToken ct){var x=db.GoldenDocuments.AsNoTracking().Where(x=>x.OrganizationId==tenant.OrganizationId);if(q.GroupId.HasValue)x=x.Where(x=>x.DocumentGroupId==q.GroupId);return x.OrderBy(x=>x.Priority).Select(x=>new GoldenDocumentResponse(x.Id,x.DocumentGroupId,x.DocumentId,x.Document!.Title,x.Priority,x.IsActive)).ToPagedResponseAsync(new PageRequest(q.PageNumber,q.PageSize),ct);}}
public sealed class SaveGoldenDocumentHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<SaveGoldenDocumentCommand,GoldenDocumentResponse?>
{
 public async Task<GoldenDocumentResponse?> Handle(SaveGoldenDocumentCommand c,CancellationToken ct)
 {
  var r=c.Request;
  if(r.Priority<1||!await db.DocumentGroups.AnyAsync(x=>x.Id==r.DocumentGroupId&&x.OrganizationId==tenant.OrganizationId&&x.IsActive,ct)||!await db.Documents.AnyAsync(x=>x.Id==r.DocumentId&&x.OrganizationId==tenant.OrganizationId,ct))return null;
  GoldenDocument? x;
  if(c.Id.HasValue)x=await db.GoldenDocuments.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct);
  else x=await db.GoldenDocuments.IgnoreQueryFilters().SingleOrDefaultAsync(x=>x.OrganizationId==tenant.OrganizationId&&x.DocumentGroupId==r.DocumentGroupId&&x.DocumentId==r.DocumentId,ct);
  if(c.Id.HasValue&&x is null)return null;
  var created=x is null;
  x??=new GoldenDocument{OrganizationId=tenant.OrganizationId,DocumentGroupId=r.DocumentGroupId,DocumentId=r.DocumentId,Priority=r.Priority,CreatedByUserId=tenant.UserId};
  x.DocumentGroupId=r.DocumentGroupId;x.DocumentId=r.DocumentId;x.Priority=r.Priority;x.IsActive=r.IsActive;x.IsDeleted=false;x.DeletedAtUtc=null;x.DeletedByUserId=null;
  if(created)db.GoldenDocuments.Add(x);
  if(!await db.DocumentGroupMembers.AnyAsync(m=>m.DocumentGroupId==r.DocumentGroupId&&m.DocumentId==r.DocumentId,ct))db.DocumentGroupMembers.Add(new DocumentGroupMember{DocumentGroupId=r.DocumentGroupId,DocumentId=r.DocumentId});
  audit.Add(created?"golden-document.created":"golden-document.updated",nameof(GoldenDocument),x.Id.ToString());
  await db.SaveChangesAsync(ct);
  var title=await db.Documents.Where(d=>d.Id==x.DocumentId).Select(d=>d.Title).SingleAsync(ct);
  return new(x.Id,x.DocumentGroupId,x.DocumentId,title,x.Priority,x.IsActive);
 }
}
public sealed class DeleteGoldenDocumentHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<DeleteGoldenDocumentCommand,bool>{public async Task<bool> Handle(DeleteGoldenDocumentCommand c,CancellationToken ct){var x=await db.GoldenDocuments.SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId,ct);if(x is null)return false;x.IsDeleted=true;x.IsActive=false;x.DeletedAtUtc=DateTime.UtcNow;x.DeletedByUserId=tenant.UserId;audit.Add("golden-document.deleted",nameof(GoldenDocument),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}
public sealed class RestoreGoldenDocumentHandler(NegareshDbContext db,ICurrentTenant tenant,IAuditWriter audit):IRequestHandler<RestoreGoldenDocumentCommand,bool>{public async Task<bool> Handle(RestoreGoldenDocumentCommand c,CancellationToken ct){var x=await db.GoldenDocuments.IgnoreQueryFilters().SingleOrDefaultAsync(x=>x.Id==c.Id&&x.OrganizationId==tenant.OrganizationId&&x.IsDeleted,ct);if(x is null)return false;x.IsDeleted=false;x.IsActive=true;x.DeletedAtUtc=null;x.DeletedByUserId=null;audit.Add("golden-document.restored",nameof(GoldenDocument),x.Id.ToString());await db.SaveChangesAsync(ct);return true;}}
