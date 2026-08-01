using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Contracts.Generation;
using NegareshAI.Api.Data;
using Xunit;

namespace NegareshAI.Api.Tests;
public sealed class EffectiveContractTemplateTests
{
 [Fact] public async Task Selects_highest_active_version_inside_effective_range()
 {
  var options=new DbContextOptionsBuilder<NegareshDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
  await using var db=new NegareshDbContext(options);var org=Guid.NewGuid();var group=Guid.NewGuid();
  db.ContractGroups.Add(new ContractGroup{Id=group,OrganizationId=org,Name="Support",CreatedByUserId="u"});
  db.ContractTemplates.AddRange(
   new ContractTemplate{OrganizationId=org,ContractGroupId=group,Name="T",ContractType="Support",FileId="1",Version=1,EffectiveFrom=new DateOnly(2026,1,1),EffectiveTo=new DateOnly(2026,12,31)},
   new ContractTemplate{OrganizationId=org,ContractGroupId=group,Name="T",ContractType="Support",FileId="2",Version=2,EffectiveFrom=new DateOnly(2026,1,1),EffectiveTo=new DateOnly(2026,12,31)});
  await db.SaveChangesAsync();var handler=new GetEffectiveContractTemplateHandler(db,new Tenant(org,"u"));
  var result=await handler.Handle(new(group,new DateOnly(2026,6,1)),default);
  Assert.NotNull(result.Template);Assert.Equal(2,result.Template!.Version);
 }
 [Fact] public async Task Fails_closed_when_group_has_no_effective_template(){var options=new DbContextOptionsBuilder<NegareshDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;await using var db=new NegareshDbContext(options);var result=await new GetEffectiveContractTemplateHandler(db,new Tenant(Guid.NewGuid(),"u")).Handle(new(Guid.NewGuid(),new DateOnly(2026,1,1)),default);Assert.Null(result.Template);Assert.NotNull(result.Reason);}
 private sealed record Tenant(Guid OrganizationId,string UserId):ICurrentTenant;
}
