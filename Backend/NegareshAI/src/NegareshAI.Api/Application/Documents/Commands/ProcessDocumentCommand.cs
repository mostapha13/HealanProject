using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;
using System.Text.Json;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record ProcessDocumentCommand(
    Guid DocumentId,
    Guid? VersionId,
    string? BearerToken) : IRequest<bool>;

public sealed class ProcessDocumentCommandHandler(
    NegareshDbContext db,
    ICurrentTenant tenant,
    IFileManagerClient fileManager,
    IAiDocumentProcessor aiProcessor,
    IAuditWriter auditWriter,
    ILogger<ProcessDocumentCommandHandler> logger)
    : IRequestHandler<ProcessDocumentCommand, bool>
{
    public async Task<bool> Handle(
        ProcessDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var document = await db.Documents
            .Include(item => item.Versions)
            .SingleOrDefaultAsync(item =>
                    item.Id == request.DocumentId
                    && item.OrganizationId == tenant.OrganizationId
                    && !item.IsDeleted,
                cancellationToken);
        if (document is null)
            return false;

        var version = request.VersionId.HasValue
            ? document.Versions.SingleOrDefault(item => item.Id == request.VersionId)
            : document.Versions.MaxBy(item => item.VersionNumber);
        if (version is null)
            return false;

        document.ProcessingStatus = DocumentProcessingStatus.Processing;
        document.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        try
        {
            var modelSetting = await db.RuntimeSettings.AsNoTracking()
                .SingleOrDefaultAsync(item =>
                        item.OrganizationId == tenant.OrganizationId
                        && item.Category == "ai"
                        && item.Key == "embedding.model"
                        && item.IsActive,
                    cancellationToken);
            if (modelSetting is null)
                throw new InvalidOperationException(
                    "Active runtime setting ai/embedding.model is required.");
            using var modelJson = JsonDocument.Parse(modelSetting.ValueJson);
            var embeddingModel = modelJson.RootElement.GetProperty("modelId").GetString();
            if (string.IsNullOrWhiteSpace(embeddingModel))
                throw new InvalidOperationException(
                    "Runtime setting ai/embedding.model must contain modelId.");
            var file = await fileManager.DownloadAsync(
                version.FileId, request.BearerToken, cancellationToken);
            var result = await aiProcessor.ProcessAsync(
                tenant.OrganizationId,
                document.Id,
                version.Id,
                file.FileName,
                file.Content,
                embeddingModel,
                document.ConfidentialityLevel == ConfidentialityLevel.Internal
                    ? "organization"
                    : "restricted",
                string.IsNullOrWhiteSpace(document.OwnerUserId)
                    ? []
                    : [document.OwnerUserId],
                [],
                cancellationToken);
            document.ProcessingStatus = result.Status == "ready"
                ? DocumentProcessingStatus.Ready
                : DocumentProcessingStatus.Failed;
            version.ExtractedText = result.ExtractedText;
            auditWriter.Add("document.processed", nameof(Document), document.Id.ToString(), new
            {
                version.Id,
                result.Status,
                result.PageCount,
                result.Characters,
                result.ChunkCount
                , result.OcrPageCount
                , EmbeddingModel = embeddingModel
            });
        }
        catch (Exception exception)
        {
            document.ProcessingStatus = DocumentProcessingStatus.Failed;
            logger.LogError(exception,
                "Private document processing failed for document {DocumentId}, version {VersionId}.",
                document.Id, version.Id);
            auditWriter.Add("document.processing-failed", nameof(Document),
                document.Id.ToString(), new { version.Id });
        }

        document.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
