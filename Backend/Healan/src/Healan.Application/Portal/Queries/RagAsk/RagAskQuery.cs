using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Services;
using Healan.Domain.Portal.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Queries.RagAsk;

public class RagAskQuery : IRequest<RagAskResponseDto>
{
    public string Question { get; set; } = string.Empty;
    public string? SessionId { get; set; }
    public string? GuestKey { get; set; }
    public string? AccessToken { get; set; }
}

public class RagAskQueryHandler : IRequestHandler<RagAskQuery, RagAskResponseDto>
{
    private const string NoAnswerMessage = "متأسفانه نمی‌توانم به این سوال پاسخ دهم. لطفاً سوال خود را ساده‌تر مطرح کنید یا با مطب تماس بگیرید.";

    private readonly IApplicationDbContext _db;
    private readonly IRagPythonService _ragPythonService;
    private readonly IPortalAuthTokenService _tokenService;
    private readonly ILogger<RagAskQueryHandler> _logger;

    public RagAskQueryHandler(
        IApplicationDbContext db,
        IRagPythonService ragPythonService,
        IPortalAuthTokenService tokenService,
        ILogger<RagAskQueryHandler> logger)
    {
        _db = db;
        _ragPythonService = ragPythonService;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<RagAskResponseDto> Handle(RagAskQuery request, CancellationToken cancellationToken)
    {
        var question = request.Question?.Trim() ?? string.Empty;
        if (question.Length < 2)
            throw new BadRequestExceptions("سوال باید حداقل ۲ کاراکتر باشد");

        var setting = await _db.RagSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        if (setting is { IsEnabled: false })
        {
            return await LogAndReturnAsync(
                question, request, null, null,
                new RagAskResponseDto
                {
                    Answer = "سرویس پاسخ‌گویی هوشمند در حال حاضر غیرفعال است.",
                    WasAnswered = false,
                },
                cancellationToken);
        }

        Guid? userId = null;
        if (_tokenService.TryValidate(request.AccessToken, out var uid, out _))
            userId = uid;

        var guestKey = string.IsNullOrWhiteSpace(request.GuestKey) ? null : request.GuestKey.Trim();
        if (!userId.HasValue && string.IsNullOrWhiteSpace(guestKey))
            throw new BadRequestExceptions("شناسه نشست نامعتبر است. صفحه را رفرش کنید.");

        var used = await RagQuotaHelper.CountTodayAsync(_db, userId, guestKey, cancellationToken);
        var (limit, usedCount, remaining, requiresLogin) = RagQuotaHelper.Evaluate(setting, userId.HasValue, used);

        if (requiresLogin || remaining <= 0)
        {
            return new RagAskResponseDto
            {
                Answer = userId.HasValue
                    ? $"سقف سوالات روزانه شما ({limit}) به پایان رسیده است. فردا دوباره تلاش کنید."
                    : $"سقف سوالات رایگان امروز ({limit}) تمام شد. در صورتی که نیاز به سوالات بیشتر دارید، وارد شوید.",
                WasAnswered = false,
                RequiresLogin = !userId.HasValue,
                UsedCount = usedCount,
                DailyLimit = limit,
                RemainingCount = 0,
                IsAuthenticated = userId.HasValue,
            };
        }

        var threshold = setting?.SimilarityThresholdPercent ?? 55;
        var pythonUrl = ResolvePythonApiUrl(setting?.PythonApiUrl);

        _logger.LogInformation(
            "RAG request received. Question={Question}, PythonUrl={PythonUrl}, Auth={Auth}, Used={Used}/{Limit}",
            question,
            pythonUrl,
            userId.HasValue,
            usedCount,
            limit);

        var result = await _ragPythonService.AskAsync(pythonUrl, question, threshold, cancellationToken);
        var response = new RagAskResponseDto
        {
            Answer = result.WasAnswered || !string.IsNullOrWhiteSpace(result.Answer)
                ? result.Answer
                : NoAnswerMessage,
            WasAnswered = result.WasAnswered,
            SimilarityScore = result.SimilarityScore,
            MatchedKnowledgeItemId = result.MatchedKnowledgeItemId,
            SourceType = result.SourceType,
            RequiresLogin = false,
            UsedCount = usedCount + 1,
            DailyLimit = limit,
            RemainingCount = Math.Max(0, remaining - 1),
            IsAuthenticated = userId.HasValue,
        };

        return await LogAndReturnAsync(question, request, userId, guestKey, response, cancellationToken);
    }

    internal static string ResolvePythonApiUrl(string? configured)
    {
        const string dockerDefault = "http://python-rag:8000";
        var url = (configured ?? string.Empty).Trim().TrimEnd('/');
        if (string.IsNullOrWhiteSpace(url))
            return dockerDefault;

        var inContainer = string.Equals(
            Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"),
            "true",
            StringComparison.OrdinalIgnoreCase);

        if (inContainer
            && (url.Contains("localhost:8000", StringComparison.OrdinalIgnoreCase)
                || url.Contains("127.0.0.1:8000", StringComparison.OrdinalIgnoreCase)))
        {
            return dockerDefault;
        }

        return url;
    }

    private async Task<RagAskResponseDto> LogAndReturnAsync(
        string question,
        RagAskQuery request,
        Guid? identityUserId,
        string? guestKey,
        RagAskResponseDto response,
        CancellationToken cancellationToken)
    {
        _db.RagChatLogs.Add(new RagChatLog
        {
            Question = question,
            Answer = response.Answer,
            MatchedKnowledgeItemId = response.MatchedKnowledgeItemId,
            SimilarityScore = response.SimilarityScore,
            SourceType = response.SourceType,
            SessionId = string.IsNullOrWhiteSpace(request.SessionId) ? null : request.SessionId.Trim(),
            GuestKey = identityUserId.HasValue ? null : guestKey,
            IdentityUserId = identityUserId,
            WasAnswered = response.WasAnswered,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken);
        return response;
    }
}
