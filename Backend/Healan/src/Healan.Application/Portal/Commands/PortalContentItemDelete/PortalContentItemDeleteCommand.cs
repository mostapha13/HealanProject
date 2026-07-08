using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Commands.PortalContentItemDelete;

public class PortalContentItemDeleteCommand : IRequest<PortalMutationResult>
{
    public long PortalContentItemId { get; set; }
}

public class PortalContentItemDeleteCommandHandler : IRequestHandler<PortalContentItemDeleteCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;

    public PortalContentItemDeleteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<PortalMutationResult> Handle(PortalContentItemDeleteCommand request, CancellationToken cancellationToken)
    {
        var item = await _db.PortalContentItems
            .FirstOrDefaultAsync(x => x.PortalContentItemId == request.PortalContentItemId, cancellationToken)
            ?? throw new KeyNotFoundException("مطلب یافت نشد");

        item.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = item.PortalContentItemId };
    }
}
