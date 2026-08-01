using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.MasterData;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;
[ApiController, Route("api/master-data"), Authorize]
[NegareshAccess(NegareshAIAccessFormIds.OtherCatalogs)]
public sealed class MasterDataController(ISender sender):ControllerBase
{
 [HttpGet("criteria")] public Task<ActionResult> List([FromQuery]int pageNumber=1,[FromQuery]int pageSize=20,CancellationToken ct=default)=>ListCore(pageNumber,pageSize,ct);
 private async Task<ActionResult> ListCore(int page,int size,CancellationToken ct)=>Ok(await sender.Send(new ListComplianceCriteriaQuery(page,size),ct));
 [HttpPost("criteria")] public async Task<ActionResult> Create(SaveComplianceCriterionRequest r,CancellationToken ct){var x=await sender.Send(new SaveComplianceCriterionCommand(null,r),ct);return x is null?BadRequest():Ok(x);}
 [HttpPut("criteria/{id:guid}")] public async Task<ActionResult> Update(Guid id,SaveComplianceCriterionRequest r,CancellationToken ct){var x=await sender.Send(new SaveComplianceCriterionCommand(id,r),ct);return x is null?NotFound():Ok(x);}
 [HttpDelete("criteria/{id:guid}")] public async Task<IActionResult> Delete(Guid id,CancellationToken ct)=>await sender.Send(new DeleteComplianceCriterionCommand(id),ct)?NoContent():NotFound();
 [HttpPost("criteria/{id:guid}/restore")] public async Task<IActionResult> Restore(Guid id,CancellationToken ct)=>await sender.Send(new RestoreComplianceCriterionCommand(id),ct)?NoContent():NotFound();
 [HttpGet("document-groups/{id:guid}/criteria")] public async Task<IActionResult> GroupCriteria(Guid id,CancellationToken ct)=>Ok(await sender.Send(new GetDocumentGroupCriteriaQuery(id),ct));
 [HttpPut("document-groups/{id:guid}/criteria")] public async Task<IActionResult> SaveGroupCriteria(Guid id,SaveDocumentGroupCriteriaRequest r,CancellationToken ct)=>await sender.Send(new SaveDocumentGroupCriteriaCommand(id,r),ct)?NoContent():BadRequest();
 [HttpGet("golden-documents")] public async Task<IActionResult> Golden([FromQuery]Guid? documentGroupId,[FromQuery]int pageNumber=1,[FromQuery]int pageSize=20,CancellationToken ct=default)=>Ok(await sender.Send(new ListGoldenDocumentsQuery(documentGroupId,pageNumber,pageSize),ct));
 [HttpPost("golden-documents")] public async Task<IActionResult> CreateGolden(SaveGoldenDocumentRequest r,CancellationToken ct){var x=await sender.Send(new SaveGoldenDocumentCommand(null,r),ct);return x is null?BadRequest():Ok(x);}
 [HttpPut("golden-documents/{id:guid}")] public async Task<IActionResult> UpdateGolden(Guid id,SaveGoldenDocumentRequest r,CancellationToken ct){var x=await sender.Send(new SaveGoldenDocumentCommand(id,r),ct);return x is null?NotFound():Ok(x);}
 [HttpDelete("golden-documents/{id:guid}")] public async Task<IActionResult> DeleteGolden(Guid id,CancellationToken ct)=>await sender.Send(new DeleteGoldenDocumentCommand(id),ct)?NoContent():NotFound();
 [HttpPost("golden-documents/{id:guid}/restore")] public async Task<IActionResult> RestoreGolden(Guid id,CancellationToken ct)=>await sender.Send(new RestoreGoldenDocumentCommand(id),ct)?NoContent():NotFound();
 [HttpGet("approved-contract-clauses"),NegareshAccess(NegareshAIAccessFormIds.ContractClauseCatalog)] public async Task<IActionResult> Clauses([FromQuery]Guid? contractGroupId,[FromQuery]int pageNumber=1,[FromQuery]int pageSize=20,CancellationToken ct=default)=>Ok(await sender.Send(new ListApprovedContractClausesQuery(contractGroupId,pageNumber,pageSize),ct));
 [HttpPost("approved-contract-clauses"),NegareshAccess(NegareshAIAccessFormIds.ContractClauseCatalog)] public async Task<IActionResult> CreateClause(SaveApprovedContractClauseRequest r,CancellationToken ct){var x=await sender.Send(new SaveApprovedContractClauseCommand(null,r),ct);return x is null?BadRequest():Ok(x);}
 [HttpPut("approved-contract-clauses/{id:guid}"),NegareshAccess(NegareshAIAccessFormIds.ContractClauseCatalog)] public async Task<IActionResult> UpdateClause(Guid id,SaveApprovedContractClauseRequest r,CancellationToken ct){var x=await sender.Send(new SaveApprovedContractClauseCommand(id,r),ct);return x is null?BadRequest():Ok(x);}
 [HttpDelete("approved-contract-clauses/{id:guid}"),NegareshAccess(NegareshAIAccessFormIds.ContractClauseCatalog)] public async Task<IActionResult> DeleteClause(Guid id,CancellationToken ct)=>await sender.Send(new DeleteApprovedContractClauseCommand(id),ct)?NoContent():NotFound();
 [HttpPost("approved-contract-clauses/{id:guid}/restore"),NegareshAccess(NegareshAIAccessFormIds.ContractClauseCatalog)] public async Task<IActionResult> RestoreClause(Guid id,CancellationToken ct)=>await sender.Send(new RestoreApprovedContractClauseCommand(id),ct)?NoContent():NotFound();
}
