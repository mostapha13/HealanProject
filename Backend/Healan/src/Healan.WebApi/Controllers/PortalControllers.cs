using Healan.Application.Portal.Commands.BlogPostDelete;
using Healan.Application.Portal.Commands.BlogPostRegister;
using Healan.Application.Portal.Commands.PatientReviewDelete;
using Healan.Application.Portal.Commands.PatientReviewModerate;
using Healan.Application.Portal.Commands.PatientReviewSubmit;
using Healan.Application.Portal.Commands.PortalContentItemDelete;
using Healan.Application.Portal.Commands.PortalContentItemRegister;
using Healan.Application.Portal.Commands.PortalOtpRequest;
using Healan.Application.Portal.Commands.PortalOtpVerify;
using Healan.Application.Portal.Commands.PortalSiteSettingSave;
using Healan.Application.Portal.Commands.RagKnowledgeDelete;
using Healan.Application.Portal.Commands.RagKnowledgeRegister;
using Healan.Application.Portal.Commands.RagSettingSave;
using Healan.Application.Portal.Queries.BlogPostInfo;
using Healan.Application.Portal.Queries.BlogPostList;
using Healan.Application.Portal.Queries.PatientReviewList;
using Healan.Application.Portal.Queries.PortalContentItemList;
using Healan.Application.Portal.Queries.PortalSiteSettingList;
using Healan.Application.Portal.Queries.PublishedBlogPostBySlug;
using Healan.Application.Portal.Queries.PublishedBlogPostList;
using Healan.Application.Portal.Queries.PublishedPortalSite;
using Healan.Application.Portal.Queries.RagAsk;
using Healan.Application.Portal.Queries.RagChatLogList;
using Healan.Application.Portal.Queries.RagKnowledgeInfo;
using Healan.Application.Portal.Queries.RagKnowledgeList;
using Healan.Application.Portal.Queries.RagQuotaStatus;
using Healan.Application.Portal.Queries.RagSettingGet;
using Healan.Domain.Portal.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Share.Domain.Constants;
using Share.Infrastructure.CustomAttributes;

namespace Healan.WebApi.Controllers;

/// <summary>
/// مدیریت محتوای سایت مطب (CMS)
/// </summary>
[AccessForm(HealanAccessFormIds.PortalContent)]
public class PortalContentController : ApiControllerBase
{
    [HttpGet("[action]")]
    public async Task<IActionResult> ContentList([FromQuery] PortalSectionType? sectionType, [FromQuery] bool? isPublished) =>
        Ok(await Mediator.Send(new PortalContentItemListQuery { SectionType = sectionType, IsPublished = isPublished }));

    [HttpPost("[action]")]
    public Task<IActionResult> ContentRegister([FromBody] PortalContentItemRegisterCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    public Task<IActionResult> ContentDelete([FromBody] PortalContentItemDeleteCommand request) =>
        SendCommand(request);

    [HttpGet("[action]")]
    public async Task<IActionResult> SettingList() =>
        Ok(await Mediator.Send(new PortalSiteSettingListQuery()));

    [HttpPost("[action]")]
    public Task<IActionResult> SettingSave([FromBody] PortalSiteSettingSaveCommand request) =>
        SendCommand(request);
}

/// <summary>
/// مدیریت بلاگ سایت مطب
/// </summary>
public class BlogPostController : ApiControllerBase
{
    [HttpGet("[action]")]
    [AccessForm(HealanAccessFormIds.PortalBlog)]
    public async Task<IActionResult> List([FromQuery] BlogPostListQuery query) =>
        Ok(await Mediator.Send(query));

    [HttpGet("[action]")]
    [AccessForm(HealanAccessFormIds.PortalBlog, HealanAccessFormIds.PortalBlogEdit)]
    public async Task<IActionResult> Info([FromQuery] long blogPostId) =>
        Ok(await Mediator.Send(new BlogPostInfoQuery { BlogPostId = blogPostId }));

    [HttpPost("[action]")]
    [AccessForm(
        HealanAccessFormIds.PortalBlogAdd,
        HealanAccessFormIds.PortalBlogEdit,
        HealanAccessFormIds.PortalBlogPublish)]
    public Task<IActionResult> Register([FromBody] BlogPostRegisterCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    [AccessForm(HealanAccessFormIds.PortalBlogDelete)]
    public Task<IActionResult> Delete([FromBody] BlogPostDeleteCommand request) =>
        SendCommand(request);
}

/// <summary>
/// مدیریت دانش پایه RAG (سوال و جواب ربات سایت)
/// </summary>
[AccessForm(HealanAccessFormIds.PortalRag, HealanAccessFormIds.AssistantSettings, HealanAccessFormIds.PortalRagLogs)]
public class RagKnowledgeController : ApiControllerBase
{
    [HttpGet("[action]")]
    public async Task<IActionResult> List([FromQuery] RagKnowledgeListQuery query) =>
        Ok(await Mediator.Send(query));

    [HttpGet("[action]")]
    public async Task<IActionResult> Info([FromQuery] long ragKnowledgeItemId) =>
        Ok(await Mediator.Send(new RagKnowledgeInfoQuery { RagKnowledgeItemId = ragKnowledgeItemId }));

    [HttpPost("[action]")]
    public Task<IActionResult> Register([FromBody] RagKnowledgeRegisterCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    public Task<IActionResult> Delete([FromBody] RagKnowledgeDeleteCommand request) =>
        SendCommand(request);

    [HttpGet("[action]")]
    public async Task<IActionResult> SettingGet() =>
        Ok(await Mediator.Send(new RagSettingGetQuery()));

    [HttpPost("[action]")]
    public async Task<IActionResult> SettingSave([FromBody] RagSettingSaveCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpGet("[action]")]
    [AccessForm(HealanAccessFormIds.PortalRagLogs, HealanAccessFormIds.PortalRag, HealanAccessFormIds.AssistantSettings)]
    public async Task<IActionResult> ChatLogList([FromQuery] RagChatLogListQuery query) =>
        Ok(await Mediator.Send(query));
}

/// <summary>
/// مدیریت نظرات بیماران
/// </summary>
[AccessForm(HealanAccessFormIds.PortalReviews)]
public class PatientReviewController : ApiControllerBase
{
    [HttpGet("[action]")]
    public async Task<IActionResult> List([FromQuery] PatientReviewStatus? status) =>
        Ok(await Mediator.Send(new PatientReviewListQuery { Status = status }));

    [HttpPost("[action]")]
    public Task<IActionResult> Moderate([FromBody] PatientReviewModerateCommand request) =>
        SendCommand(request);

    [HttpPost("[action]")]
    public Task<IActionResult> Delete([FromBody] PatientReviewDeleteCommand request) =>
        SendCommand(request);
}

/// <summary>
/// API عمومی سایت مطب — بدون نیاز به ورود
/// </summary>
[ApiController]
[Route("Healan/api/v1/[controller]")]
[Produces("application/json")]
[AllowAnonymous]
public class PortalPublicController : ControllerBase
{
    private IMediator? _mediator;
    private IMediator Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<IMediator>();

    [HttpGet("[action]")]
    public async Task<IActionResult> Site() =>
        Ok(await Mediator.Send(new PublishedPortalSiteQuery()));

    [HttpPost("[action]")]
    public async Task<IActionResult> SubmitReview([FromBody] PatientReviewSubmitCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpGet("[action]")]
    public async Task<IActionResult> BlogList([FromQuery] PublishedBlogPostListQuery query) =>
        Ok(await Mediator.Send(query));

    [HttpGet("[action]")]
    public async Task<IActionResult> BlogPost([FromQuery] string slug) =>
        Ok(await Mediator.Send(new PublishedBlogPostBySlugQuery { Slug = slug }));

    [HttpPost("[action]")]
    public async Task<IActionResult> RagAsk([FromBody] RagAskQuery query)
    {
        query.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("[action]")]
    public async Task<IActionResult> RagQuota([FromQuery] string? guestKey) =>
        Ok(await Mediator.Send(new RagQuotaStatusQuery
        {
            GuestKey = guestKey,
            AccessToken = ExtractBearerToken(),
        }));

    [HttpPost("[action]")]
    public async Task<IActionResult> RagOtpRequest([FromBody] PortalOtpRequestCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpPost("[action]")]
    public async Task<IActionResult> RagOtpVerify([FromBody] PortalOtpVerifyCommand request) =>
        Ok(await Mediator.Send(request));

    private string? ExtractBearerToken()
    {
        var header = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(header))
            return null;
        const string prefix = "Bearer ";
        return header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? header[prefix.Length..].Trim()
            : header.Trim();
    }
}
