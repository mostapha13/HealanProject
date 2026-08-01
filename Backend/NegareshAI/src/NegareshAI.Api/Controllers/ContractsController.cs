using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NegareshAI.Api.Application.Contracts.Commands;
using NegareshAI.Api.Application.Contracts.Queries;
using NegareshAI.Api.Application.Contracts.Generation;
using NegareshAI.Api.Application.Contracts.Catalog;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Security;

namespace NegareshAI.Api.Controllers;

[ApiController]
[Route("api/contracts")]
[Authorize]
public sealed class ContractsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [NegareshAccess(NegareshAIAccessFormIds.Contracts)]
    public async Task<ActionResult<ContractListResponse>> List(
        [FromQuery] string? search, [FromQuery] ContractStatus? status,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListContractsQuery(search, status, page, pageSize),
            cancellationToken));

    [HttpGet("{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.Contracts)]
    public async Task<ActionResult<ContractDetailResponse>> Get(
        Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetContractQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [NegareshAccess(NegareshAIAccessFormIds.Contracts)]
    [NegareshAccess(NegareshAIAccessFormIds.ContractsCreate)]
    public async Task<ActionResult<ContractDetailResponse>> Create(
        SaveContractRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateContractCommand(request), cancellationToken);
        return result is null ? Conflict("Document not found or already has a contract.")
            : CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.Contracts)]
    [NegareshAccess(NegareshAIAccessFormIds.ContractsEdit)]
    public async Task<ActionResult<ContractDetailResponse>> Update(
        Guid id, SaveContractRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new UpdateContractCommand(id, request), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/archive")]
    [NegareshAccess(NegareshAIAccessFormIds.Contracts)]
    [NegareshAccess(NegareshAIAccessFormIds.ContractsDelete)]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken) =>
        await sender.Send(new ArchiveContractCommand(id), cancellationToken)
            ? NoContent() : NotFound();

    [HttpGet("templates")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<IActionResult> Templates(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new ListContractTemplatesQuery(
            pageNumber, pageSize), cancellationToken));

    [HttpPost("templates")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ContractTemplateResponse>> CreateTemplate(
        [FromForm] ContractTemplateUploadRequest request, CancellationToken cancellationToken)
    {
        if (!request.File.FileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Template must be a DOCX file.");
        var result = await sender.Send(new CreateContractTemplateCommand(
            new(request.Name, request.ContractType, request.Description, request.ContractGroupId,
                request.ContractYear, request.EffectiveFrom, request.EffectiveTo),
            request.File.OpenReadStream(), request.File.FileName,
            request.File.ContentType), cancellationToken);
        return Ok(result);
    }

    [HttpGet("templates/effective")]
    public async Task<ActionResult<EffectiveContractTemplateResponse>> EffectiveTemplate([FromQuery] Guid contractGroupId,[FromQuery] DateOnly startDate,CancellationToken ct) => Ok(await sender.Send(new GetEffectiveContractTemplateQuery(contractGroupId,startDate),ct));

    [HttpPut("templates/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<ActionResult<ContractTemplateResponse>> UpdateTemplate(Guid id,UpdateContractTemplateRequest request,CancellationToken ct){var result=await sender.Send(new UpdateContractTemplateCommand(id,request),ct);return result is null?BadRequest():Ok(result);}
    [HttpDelete("templates/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<IActionResult> DeleteTemplate(Guid id,CancellationToken ct)=>await sender.Send(new DeleteContractTemplateCommand(id),ct)?NoContent():NotFound();
    [HttpPost("templates/{id:guid}/restore")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<IActionResult> RestoreTemplate(Guid id,CancellationToken ct)=>await sender.Send(new RestoreContractTemplateCommand(id),ct)?NoContent():NotFound();

    [HttpPost("generations")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<ActionResult<ContractGenerationResponse>> Generate(
        StartContractGenerationRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new StartContractGenerationCommand(request), cancellationToken);
        return result is null ? NotFound("Contract, base version, or template was not found.") : Ok(result);
    }

    [HttpGet("generations/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<ActionResult<ContractGenerationResponse>> GetGeneration(
        Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetContractGenerationQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("generations/{id:guid}/review")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<ActionResult<ContractGenerationResponse>> ReviewGeneration(
        Guid id, ReviewContractGenerationRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ReviewContractGenerationCommand(id, request),
            cancellationToken);
        return result is null ? Conflict("Generation is not ready for review.") : Ok(result);
    }

    [HttpGet("conversations")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<ActionResult<IReadOnlyList<ContractConversationListItemResponse>>> Conversations(
        CancellationToken ct) => Ok(await sender.Send(new ListContractConversationsQuery(), ct));

    [HttpPost("conversations")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<ActionResult<ContractConversationResponse>> StartConversation(
        StartContractConversationRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new StartContractConversationCommand(request), ct);
        return result is null ? BadRequest("اطلاعات طرف قرارداد، گروه یا پیام معتبر نیست.") : Ok(result);
    }

    [HttpGet("conversations/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<ActionResult<ContractConversationResponse>> Conversation(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetContractConversationQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("conversations/{id:guid}/messages")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public async Task<ActionResult<ContractConversationResponse>> SendMessage(
        Guid id, SendContractConversationMessageRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new SendContractConversationMessageCommand(id, request.Message), ct);
        return result is null ? Conflict("گفت‌وگو قابل ادامه نیست.") : Ok(result);
    }

    [HttpPost("conversations/{conversationId:guid}/drafts/{draftId:guid}/requester-review")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractGeneration)]
    public Task<ActionResult<ContractConversationResponse>> RequesterReview(
        Guid conversationId, Guid draftId, ReviewContractDraftRequest request, CancellationToken ct) =>
        ReviewDraft(conversationId, draftId, ContractDraftApprovalStatus.RequesterReview, request, ct);

    [HttpPost("conversations/{conversationId:guid}/drafts/{draftId:guid}/expert-review")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractExpertReview)]
    public Task<ActionResult<ContractConversationResponse>> ExpertReview(
        Guid conversationId, Guid draftId, ReviewContractDraftRequest request, CancellationToken ct) =>
        ReviewDraft(conversationId, draftId, ContractDraftApprovalStatus.ExpertReview, request, ct);

    [HttpPost("conversations/{conversationId:guid}/drafts/{draftId:guid}/manager-review")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractFinalize)]
    public Task<ActionResult<ContractConversationResponse>> ManagerReview(
        Guid conversationId, Guid draftId, ReviewContractDraftRequest request, CancellationToken ct) =>
        ReviewDraft(conversationId, draftId, ContractDraftApprovalStatus.ManagerReview, request, ct);

    [HttpGet("catalog/{kind}")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractStatuses)]
    public async Task<ActionResult> ListCatalog(
        string kind, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await sender.Send(new ListContractCatalogQuery(
            kind, pageNumber, pageSize), ct));

    [HttpPost("catalog/statuses")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractStatuses)]
    public Task<ActionResult> CreateStatus(SaveContractStatusDefinitionRequest request, CancellationToken ct) =>
        SaveCatalog("statuses", null, request, ct);
    [HttpPut("catalog/statuses/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractStatuses)]
    public Task<ActionResult> UpdateStatus(Guid id, SaveContractStatusDefinitionRequest request, CancellationToken ct) =>
        SaveCatalog("statuses", id, request, ct);

    [HttpPost("catalog/base-documents")]
    [NegareshAccess(NegareshAIAccessFormIds.BaseDocuments)]
    public Task<ActionResult> CreateBaseDocument(SaveContractBaseDocumentRequest request, CancellationToken ct) =>
        SaveCatalog("base-documents", null, request, ct);
    [HttpPut("catalog/base-documents/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.BaseDocuments)]
    public Task<ActionResult> UpdateBaseDocument(Guid id, SaveContractBaseDocumentRequest request, CancellationToken ct) =>
        SaveCatalog("base-documents", id, request, ct);

    [HttpPost("catalog/parties")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractParties)]
    public Task<ActionResult> CreateParty(SaveOrganizationPartyRequest request, CancellationToken ct) =>
        SaveCatalog("parties", null, request, ct);
    [HttpPut("catalog/parties/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.ContractParties)]
    public Task<ActionResult> UpdateParty(Guid id, SaveOrganizationPartyRequest request, CancellationToken ct) =>
        SaveCatalog("parties", id, request, ct);

    [HttpPost("catalog/groups")]
    [NegareshAccess(NegareshAIAccessFormIds.OtherCatalogs)]
    public Task<ActionResult> CreateGroup(SaveContractGroupRequest request, CancellationToken ct) =>
        SaveCatalog("groups", null, request, ct);

    [HttpPut("catalog/groups/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.OtherCatalogs)]
    public Task<ActionResult> UpdateGroup(Guid id, SaveContractGroupRequest request, CancellationToken ct) =>
        SaveCatalog("groups", id, request, ct);

    [HttpPost("catalog/years")]
    [NegareshAccess(NegareshAIAccessFormIds.OtherCatalogs)]
    public Task<ActionResult> CreateYear(SaveContractYearRequest request, CancellationToken ct) => SaveCatalog("years", null, request, ct);
    [HttpPut("catalog/years/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.OtherCatalogs)]
    public Task<ActionResult> UpdateYear(Guid id, SaveContractYearRequest request, CancellationToken ct) => SaveCatalog("years", id, request, ct);

    [HttpDelete("catalog/{kind}/{id:guid}")]
    [NegareshAccess(NegareshAIAccessFormIds.OtherCatalogs)]
    public async Task<IActionResult> DeleteCatalog(string kind, Guid id, CancellationToken ct) =>
        await sender.Send(new DeleteContractCatalogCommand(kind, id), ct) ? NoContent() : Conflict();
    [HttpPost("catalog/{kind}/{id:guid}/restore")]
    [NegareshAccess(NegareshAIAccessFormIds.OtherCatalogs)]
    public async Task<IActionResult> RestoreCatalog(string kind,Guid id,CancellationToken ct)=>await sender.Send(new RestoreContractCatalogCommand(kind,id),ct)?NoContent():NotFound();

    private async Task<ActionResult> SaveCatalog(
        string kind, Guid? id, object request, CancellationToken ct)
    {
        var result = await sender.Send(new SaveContractCatalogCommand(kind, id, request), ct);
        return result is null ? NotFound() : Ok(result);
    }

    private async Task<ActionResult<ContractConversationResponse>> ReviewDraft(
        Guid conversationId, Guid draftId, ContractDraftApprovalStatus expected,
        ReviewContractDraftRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new ReviewContractDraftCommand(
            conversationId, draftId, expected, request), ct);
        return result is null ? Conflict("مرحله بازبینی پیش‌نویس معتبر نیست.") : Ok(result);
    }
}

public sealed class ContractTemplateUploadRequest
{
    public required string Name { get; init; }
    public required string ContractType { get; init; }
    public string? Description { get; init; }
    public Guid? ContractGroupId { get; init; }
    public int? ContractYear { get; init; }
    public DateOnly? EffectiveFrom { get; init; }
    public DateOnly? EffectiveTo { get; init; }
    public required IFormFile File { get; init; }
}
