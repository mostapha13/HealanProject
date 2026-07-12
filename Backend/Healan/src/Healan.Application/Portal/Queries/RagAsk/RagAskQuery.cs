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
        var pythonUrl = setting?.PythonApiUrl ?? "http://localhost:8000";

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
