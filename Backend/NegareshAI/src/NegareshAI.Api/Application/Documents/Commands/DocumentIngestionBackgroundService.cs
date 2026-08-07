using System.Text.Json;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record DocumentIngestionJob(
    Guid OrganizationId, string UserId, Guid DocumentId, Guid VersionId,
    string EmbeddingModel, string? BearerToken);

public interface IDocumentIngestionQueue
{
    ValueTask EnqueueAsync(DocumentIngestionJob job, CancellationToken cancellationToken);
    ValueTask<DocumentIngestionJob> DequeueAsync(CancellationToken cancellationToken);
}

public sealed class DocumentIngestionQueue : IDocumentIngestionQueue
{
    private readonly Channel<DocumentIngestionJob> _jobs = Channel.CreateUnbounded<DocumentIngestionJob>(
        new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });

    public ValueTask EnqueueAsync(DocumentIngestionJob job, CancellationToken cancellationToken) =>
        _jobs.Writer.WriteAsync(job, cancellationToken);

    public ValueTask<DocumentIngestionJob> DequeueAsync(CancellationToken cancellationToken) =>
        _jobs.Reader.ReadAsync(cancellationToken);
}

public sealed class DocumentIngestionWorker(
    IDocumentIngestionQueue queue, IServiceScopeFactory scopeFactory,
    ILogger<DocumentIngestionWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var job = await queue.DequeueAsync(stoppingToken);
            try { await ProcessAsync(job, stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception exception)
            {
                logger.LogError(exception, "Background ingestion failed for document {DocumentId}.", job.DocumentId);
                await MarkFailedAsync(job, exception.Message, stoppingToken);
            }
        }
    }

    private async Task ProcessAsync(DocumentIngestionJob job, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NegareshDbContext>();
        var files = scope.ServiceProvider.GetRequiredService<IFileManagerClient>();
        var ai = scope.ServiceProvider.GetRequiredService<IAiDocumentProcessor>();
        var document = await db.Documents.Include(x => x.Versions).ThenInclude(x => x.Files)
            .SingleAsync(x => x.Id == job.DocumentId && x.OrganizationId == job.OrganizationId, ct);
        var version = document.Versions.Single(x => x.Id == job.VersionId);
        var inputs = version.Files.OrderBy(x => x.SortOrder).ToArray();
        var extractedPages = new SortedDictionary<int, string>();
        var extractionRows = new List<object>();
        await SetProgressAsync(db, document, version, 5, "در صف پردازش", ct);

        for (var inputIndex = 0; inputIndex < inputs.Length; inputIndex++)
        {
            var input = inputs[inputIndex];
            var start = 10 + (int)Math.Floor(inputIndex * 80d / inputs.Length);
            await SetProgressAsync(db, document, version, start,
                $"استخراج متن فایل {inputIndex + 1} از {inputs.Length}", ct);
            var download = await files.DownloadAsync(input.FileId, job.BearerToken, ct);
            var result = await ai.ProcessAsync(job.OrganizationId, document.Id, version.Id,
                input.FileName, download.Content, job.EmbeddingModel, "restricted",
                [job.UserId], [], false, ct);
            var texts = (result.ExtractedText ?? string.Empty).Split('\f');
            var firstPage = input.PageNumber ?? (extractedPages.Count + 1);
            for (var index = 0; index < texts.Length; index++)
                extractedPages[firstPage + index] = texts[index];
            extractionRows.Add(new { input.FileName, input.PageNumber, result.PageCount,
                result.Characters, result.OcrPageCount, input.Sha256 });
        }

        await SetProgressAsync(db, document, version, 92, "تجمیع و آماده‌سازی متن", ct);
        version.ExtractedText = string.Join("\f", extractedPages.OrderBy(x => x.Key).Select(x => x.Value));
        version.ExtractedFieldsJson = DocumentIngestionSupport.SuggestFields(version.ExtractedText);
        version.ExtractionMetadataJson = JsonSerializer.Serialize(new
        {
            progressPercent = 100, processingStage = "آماده برای مقایسه",
            files = extractionRows, embeddingModel = job.EmbeddingModel
        });
        version.LifecycleStatus = DocumentVersionLifecycleStatus.Extracted;
        document.ProcessingStatus = DocumentProcessingStatus.Ready;
        document.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static async Task SetProgressAsync(NegareshDbContext db, Document document,
        DocumentVersion version, int percent, string stage, CancellationToken ct)
    {
        version.ExtractionMetadataJson = JsonSerializer.Serialize(new
            { progressPercent = percent, processingStage = stage });
        document.ProcessingStatus = DocumentProcessingStatus.Processing;
        document.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private async Task MarkFailedAsync(DocumentIngestionJob job, string reason, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NegareshDbContext>();
        var document = await db.Documents.Include(x => x.Versions)
            .SingleOrDefaultAsync(x => x.Id == job.DocumentId && x.OrganizationId == job.OrganizationId, ct);
        var version = document?.Versions.SingleOrDefault(x => x.Id == job.VersionId);
        if (document is null || version is null) return;
        document.ProcessingStatus = DocumentProcessingStatus.Failed;
        version.ExtractionMetadataJson = JsonSerializer.Serialize(new
            { progressPercent = 100, processingStage = "پردازش ناموفق", failureReason = reason });
        document.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
