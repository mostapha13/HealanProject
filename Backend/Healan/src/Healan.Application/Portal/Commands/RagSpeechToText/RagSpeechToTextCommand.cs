using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Queries.RagAsk;
using Healan.Application.Portal.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.RagSpeechToText;

public class RagSpeechToTextCommand : IRequest<RagSpeechToTextResultDto>
{
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string FileName { get; set; } = "voice.webm";
    public string ContentType { get; set; } = "audio/webm";
}

public class RagSpeechToTextResultDto
{
    public string Text { get; set; } = string.Empty;
    public string Language { get; set; } = "fa";
    public double? DurationSeconds { get; set; }
    public string? Model { get; set; }
}

public class RagSpeechToTextCommandHandler : IRequestHandler<RagSpeechToTextCommand, RagSpeechToTextResultDto>
{
    private const int MaxBytes = 8 * 1024 * 1024;

    private readonly IApplicationDbContext _db;
    private readonly IRagPythonService _ragPythonService;

    public RagSpeechToTextCommandHandler(IApplicationDbContext db, IRagPythonService ragPythonService)
    {
        _db = db;
        _ragPythonService = ragPythonService;
    }

    public async Task<RagSpeechToTextResultDto> Handle(
        RagSpeechToTextCommand request,
        CancellationToken cancellationToken)
    {
        if (request.Content == null || request.Content.Length == 0)
            throw new BadRequestExceptions("فایل صوتی ارسال نشده است.");
        if (request.Content.Length > MaxBytes)
            throw new BadRequestExceptions("حجم فایل صوتی بیش از ۸ مگابایت است.");

        var setting = await _db.RagSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        var pythonUrl = RagAskQueryHandler.ResolvePythonApiUrl(setting?.PythonApiUrl);

        var result = await _ragPythonService.SpeechToTextAsync(
            pythonUrl,
            request.Content,
            request.FileName,
            request.ContentType,
            cancellationToken);

        return new RagSpeechToTextResultDto
        {
            Text = result.Text,
            Language = result.Language,
            DurationSeconds = result.DurationSeconds,
            Model = result.Model,
        };
    }
}
