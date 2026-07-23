using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.PortalSeoPageDelete;

public class PortalSeoPageDeleteCommand : IRequest<PortalMutationResult>
{
    public long PortalSeoPageId { get; set; }
}

public class PortalSeoPageDeleteCommandHandler : IRequestHandler<PortalSeoPageDeleteCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;

    public PortalSeoPageDeleteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<PortalMutationResult> Handle(PortalSeoPageDeleteCommand request, CancellationToken cancellationToken)
    {
        // Hard-delete so unique PageKey can be reused (Auditable soft-delete would block re-create).
        var deleted = await _db.PortalSeoPages
            .IgnoreQueryFilters()
            .Where(x => x.PortalSeoPageId == request.PortalSeoPageId)
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted == 0)
            throw new NotFoundExceptions("رکورد SEO یافت نشد");

        return new PortalMutationResult { Id = request.PortalSeoPageId };
    }
}
