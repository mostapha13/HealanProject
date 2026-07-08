using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Commands.PatientReviewDelete;

public class PatientReviewDeleteCommand : IRequest<PortalMutationResult>
{
    public long PatientReviewId { get; set; }
}

public class PatientReviewDeleteCommandHandler : IRequestHandler<PatientReviewDeleteCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;

    public PatientReviewDeleteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<PortalMutationResult> Handle(PatientReviewDeleteCommand request, CancellationToken cancellationToken)
    {
        var review = await _db.PatientReviews
            .FirstOrDefaultAsync(x => x.PatientReviewId == request.PatientReviewId, cancellationToken)
            ?? throw new KeyNotFoundException("نظر یافت نشد");

        review.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = review.PatientReviewId };
    }
}
