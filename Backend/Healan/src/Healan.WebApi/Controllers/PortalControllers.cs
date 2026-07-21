using Healan.Application.Booking.Commands.PortalBook;
using Healan.Application.Booking.Commands.PortalPatientRegister;
using Healan.Application.Booking.Queries.PortalBooking;
using Healan.Application.Common.MasterData;
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
using Healan.Application.Portal.Commands.RagChatLogDelete;
using Healan.Application.Portal.Commands.RagKnowledgeDelete;
using Healan.Application.Portal.Commands.RagKnowledgeRegister;
using Healan.Application.Portal.Commands.RagSettingSave;
using Healan.Application.Portal.PatientArea;
using Healan.Application.Portal.Queries.BlogPostInfo;
using Healan.Application.Portal.Queries.BlogPostList;
using Healan.Application.Portal.Queries.PatientReviewList;
using Healan.Application.Portal.Queries.PortalContentItemList;
using Healan.Application.Portal.Queries.PortalSiteSettingList;
using Healan.Application.Portal.Queries.PublishedBlogPostBySlug;
using Healan.Application.Portal.Queries.PublishedBlogPostList;
using Healan.Application.Portal.Queries.PublishedPortalSite;
using Healan.Application.Portal.Commands.RagSpeechToText;
using Healan.Application.Portal.Queries.RagAsk;
using Healan.Application.Portal.Queries.RagChatLogList;
using Healan.Application.Portal.Queries.RagKnowledgeInfo;
using Healan.Application.Portal.Queries.RagKnowledgeList;
using Healan.Application.Portal.Queries.RagQuotaStatus;
using Healan.Application.Portal.Queries.RagSettingGet;
using Healan.Domain.Portal.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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
    public async Task<IActionResult> ContentDeletedList() =>
        Ok(await Mediator.Send(new MasterDataDeletedListQuery { Type = MasterDataType.PortalContentItem }));

    [HttpPost("[action]")]
    public async Task<IActionResult> ContentRestore([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataRestoreCommand { Type = MasterDataType.PortalContentItem, Id = request.Id }));

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

    [HttpGet("[action]")]
    [AccessForm(HealanAccessFormIds.PortalBlog)]
    public async Task<IActionResult> DeletedList() =>
        Ok(await Mediator.Send(new MasterDataDeletedListQuery { Type = MasterDataType.BlogPost }));

    [HttpPost("[action]")]
    [AccessForm(HealanAccessFormIds.PortalBlogEdit)]
    public async Task<IActionResult> Restore([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataRestoreCommand { Type = MasterDataType.BlogPost, Id = request.Id }));
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
    public async Task<IActionResult> DeletedList() =>
        Ok(await Mediator.Send(new MasterDataDeletedListQuery { Type = MasterDataType.RagKnowledgeItem }));

    [HttpPost("[action]")]
    public async Task<IActionResult> Restore([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataRestoreCommand { Type = MasterDataType.RagKnowledgeItem, Id = request.Id }));

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

    [HttpPost("[action]")]
    [AccessForm(HealanAccessFormIds.PortalRagLogs, HealanAccessFormIds.PortalRag, HealanAccessFormIds.AssistantSettings)]
    public Task<IActionResult> ChatLogDelete([FromBody] RagChatLogDeleteCommand request) =>
        SendCommand(request);
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

    [HttpGet("[action]")]
    public async Task<IActionResult> DeletedList() =>
        Ok(await Mediator.Send(new MasterDataDeletedListQuery { Type = MasterDataType.PatientReview }));

    [HttpPost("[action]")]
    public async Task<IActionResult> Restore([FromBody] MasterDataItemRequest request) =>
        Ok(await Mediator.Send(new MasterDataRestoreCommand { Type = MasterDataType.PatientReview, Id = request.Id }));
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

    /// <summary>
    /// تبدیل گفتار فارسی به متن (Whisper روی python-rag) — متن برمی‌گردد تا کاربر تأیید/ویرایش کند.
    /// </summary>
    [HttpPost("[action]")]
    [RequestSizeLimit(8 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 8 * 1024 * 1024)]
    public async Task<IActionResult> RagSpeechToText(IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { title = "فایل صوتی ارسال نشده است." });

        await using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var result = await Mediator.Send(new RagSpeechToTextCommand
        {
            Content = ms.ToArray(),
            FileName = string.IsNullOrWhiteSpace(file.FileName) ? "voice.webm" : file.FileName,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "audio/webm" : file.ContentType,
        });
        return Ok(result);
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

    [HttpGet("[action]")]
    public async Task<IActionResult> BookingDoctors() =>
        Ok(await Mediator.Send(new PortalHeartDoctorsQuery()));

    [HttpGet("[action]")]
    public async Task<IActionResult> BookingOpenSlots([FromQuery] PortalOpenSlotsQuery query) =>
        Ok(await Mediator.Send(query));

    [HttpGet("[action]")]
    public async Task<IActionResult> BookingServices() =>
        Ok(await Mediator.Send(new PortalBookingServicesQuery()));

    [HttpGet("[action]")]
    public async Task<IActionResult> BookingLookupPatient([FromQuery] string? phoneNumber, [FromQuery] string? nationalCode) =>
        Ok(await Mediator.Send(new BookingLookupPatientQuery
        {
            PhoneNumber = phoneNumber,
            NationalCode = nationalCode,
        }));

    [HttpPost("[action]")]
    public async Task<IActionResult> BookingOtpRequest([FromBody] BookingOtpRequestCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpPost("[action]")]
    public async Task<IActionResult> BookingOtpVerify([FromBody] BookingOtpVerifyCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpPost("[action]")]
    public async Task<IActionResult> BookingRegisterOtpRequest([FromBody] BookingRegisterOtpRequestCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpPost("[action]")]
    public async Task<IActionResult> BookingRegisterOtpVerify([FromBody] BookingRegisterOtpVerifyCommand request) =>
        Ok(await Mediator.Send(request));

    [HttpPost("[action]")]
    public async Task<IActionResult> BookingCompleteProfile([FromBody] BookingCompleteProfileCommand request)
    {
        request.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(request));
    }

    [HttpGet("[action]")]
    public async Task<IActionResult> BookingProfileStatus() =>
        Ok(await Mediator.Send(new BookingProfileStatusQuery { AccessToken = ExtractBearerToken() }));

    [HttpPost("[action]")]
    public async Task<IActionResult> BookingCreate([FromBody] PortalBookCommand request)
    {
        request.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(request));
    }

    [HttpGet("[action]")]
    public async Task<IActionResult> BookingMyList([FromQuery] PortalMyBookingsQuery query)
    {
        query.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(query));
    }

    [HttpPost("[action]")]
    public async Task<IActionResult> BookingCancel([FromBody] PortalCancelBookingCommand request)
    {
        request.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(request));
    }

    [HttpPost("[action]")]
    public async Task<IActionResult> BookingReschedule([FromBody] PortalRescheduleBookingCommand request)
    {
        request.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(request));
    }

    [HttpGet("[action]")]
    public async Task<IActionResult> MyHistory() =>
        Ok(await Mediator.Send(new PortalMyHistoryQuery { AccessToken = ExtractBearerToken() }));

    [HttpGet("[action]")]
    public async Task<IActionResult> MyBloodPressure() =>
        Ok(await Mediator.Send(new PortalBloodPressureListQuery { AccessToken = ExtractBearerToken() }));

    [HttpPost("[action]")]
    public async Task<IActionResult> MyBloodPressureSave([FromBody] PortalBloodPressureSaveCommand request)
    {
        request.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(request));
    }

    [HttpPost("[action]")]
    public async Task<IActionResult> MyBloodPressureDelete([FromBody] PortalBloodPressureDeleteCommand request)
    {
        request.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(request));
    }

    [HttpGet("[action]")]
    public async Task<IActionResult> MyMedications() =>
        Ok(await Mediator.Send(new PortalMedicationListQuery { AccessToken = ExtractBearerToken() }));

    [HttpPost("[action]")]
    public async Task<IActionResult> MyMedicationSave([FromBody] PortalMedicationSaveCommand request)
    {
        request.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(request));
    }

    [HttpPost("[action]")]
    public async Task<IActionResult> MyMedicationDelete([FromBody] PortalMedicationDeleteCommand request)
    {
        request.AccessToken ??= ExtractBearerToken();
        return Ok(await Mediator.Send(request));
    }

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
