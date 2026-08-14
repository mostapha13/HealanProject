using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Dtos;
using Healan.Application.Portal.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Commands.RagReindex;

public class RagReindexCommand : IRequest<RagReindexResultDto> { }

public class RagReindexCommandHandler : IRequestHandler<RagReindexCommand, RagReindexResultDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IRagPythonService _rag;

    public RagReindexCommandHandler(IApplicationDbContext db, IRagPythonService rag)
    {
        _db = db;
        _rag = rag;
    }

    public async Task<RagReindexResultDto> Handle(RagReindexCommand request, CancellationToken cancellationToken)
    {
        var setting = await _db.RagSettings.FirstOrDefaultAsync(cancellationToken);
        var result = await _rag.IngestAsync(
            setting?.PythonApiUrl ?? "http://python-rag:8000",
            cancellationToken);
        if (setting != null)
        {
            setting.LastSyncedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }
        return new RagReindexResultDto
        {
            Indexed = result.Indexed,
            DocumentCount = result.DocumentCount,
            Source = result.Source,
            EmbeddingModel = result.EmbeddingModel,
        };
    }
}
