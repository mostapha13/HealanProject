using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.RagChatLogDelete;

public class RagChatLogDeleteCommand : IRequest<PortalMutationResult>
{
    /// <summary>یک یا چند شناسه گفتگو برای حذف.</summary>
    public List<long> RagChatLogIds { get; set; } = new();
}

public class RagChatLogDeleteCommandHandler : IRequestHandler<RagChatLogDeleteCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;

    public RagChatLogDeleteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<PortalMutationResult> Handle(RagChatLogDeleteCommand request, CancellationToken cancellationToken)
    {
        var ids = (request.RagChatLogIds ?? new List<long>())
            .Where(x => x > 0)
            .Distinct()
            .ToList();
        if (ids.Count == 0)
            throw new BadRequestExceptions("هیچ گفتگویی برای حذف انتخاب نشده است.");

        var rows = await _db.RagChatLogs
            .Where(x => ids.Contains(x.RagChatLogId))
            .ToListAsync(cancellationToken);
        if (rows.Count == 0)
            throw new NotFoundExceptions("گفتگوی انتخاب‌شده یافت نشد.");

        _db.RagChatLogs.RemoveRange(rows);
        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = rows.Count };
    }
}
