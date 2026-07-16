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
}

public class RagAskQueryHandler : IRequestHandler<RagAskQuery, RagAskResponseDto>
{
    private const string NoAnswerMessage = "متأسفانه نمی‌توانم به این سوال پاسخ دهم. لطفاً سوال خود را ساده‌تر مطرح کنید یا با مطب تماس بگیرید.";

    private readonly IApplicationDbContext _db;
    private readonly IRagPythonService _ragPythonService;
    private readonly ILogger<RagAskQueryHandler> _logger;

    public RagAskQueryHandler(
        IApplicationDbContext db,
        IRagPythonService ragPythonService,
        ILogger<RagAskQueryHandler> logger)
    {
        _db = db;
        _ragPythonService = ragPythonService;
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
            return await LogAndReturnAsync(question, request.SessionId, new RagAskResponseDto
            {
                Answer = "سرویس پاسخ‌گویی هوشمند در حال حاضر غیرفعال است.",
                WasAnswered = false,
            }, cancellationToken);
        }

        var threshold = setting?.SimilarityThresholdPercent ?? 55;
        var pythonUrl = ResolvePythonApiUrl(setting?.PythonApiUrl);

        _logger.LogInformation(
            "RAG request received. Question={Question}, PythonUrl={PythonUrl}, ThresholdPercent={ThresholdPercent}, RagEnabled={RagEnabled}",
            question,
            pythonUrl,
            threshold,
            setting?.IsEnabled ?? true);

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
        };

        _logger.LogInformation(
            "RAG response prepared. WasAnswered={WasAnswered}, SimilarityScore={SimilarityScore}, MatchedKnowledgeItemId={MatchedKnowledgeItemId}, SourceType={SourceType}",
            response.WasAnswered,
            response.SimilarityScore,
            response.MatchedKnowledgeItemId,
            response.SourceType);

        return await LogAndReturnAsync(question, request.SessionId, response, cancellationToken);
    }

    /// <summary>
    /// In Docker, localhost:8000 inside healan-webapi is the API container itself — rewrite to python-rag.
    /// </summary>
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
        string? sessionId,
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
            SessionId = string.IsNullOrWhiteSpace(sessionId) ? null : sessionId.Trim(),
            WasAnswered = response.WasAnswered,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken);
        return response;
    }
}
