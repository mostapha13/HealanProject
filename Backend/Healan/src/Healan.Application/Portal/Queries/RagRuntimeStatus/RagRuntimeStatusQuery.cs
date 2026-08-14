using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Dtos;
using Healan.Application.Portal.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.RagRuntimeStatus;

public class RagRuntimeStatusQuery : IRequest<RagRuntimeStatusDto> { }

public class RagRuntimeStatusQueryHandler : IRequestHandler<RagRuntimeStatusQuery, RagRuntimeStatusDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IRagPythonService _rag;

    public RagRuntimeStatusQueryHandler(IApplicationDbContext db, IRagPythonService rag)
    {
        _db = db;
        _rag = rag;
    }

    public async Task<RagRuntimeStatusDto> Handle(RagRuntimeStatusQuery request, CancellationToken cancellationToken)
    {
        var setting = await _db.RagSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        var result = await _rag.GetStatusAsync(
            setting?.PythonApiUrl ?? "http://python-rag:8000",
            cancellationToken);
        return new RagRuntimeStatusDto
        {
            IsAvailable = result.IsAvailable,
            DocumentCount = result.DocumentCount,
            Ingesting = result.Ingesting,
            LastIngestError = result.LastIngestError,
            DataSource = result.DataSource,
            EmbeddingModel = result.EmbeddingModel,
        };
    }
}
