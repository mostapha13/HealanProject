using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;

namespace Healan.Application.Portal.Commands.PatientReviewModerate;

public class PatientReviewModerateCommand : IRequest<PortalMutationResult>
{
    public long PatientReviewId { get; set; }
    public PatientReviewStatus Status { get; set; }
    public string? AdminNote { get; set; }
    public int? SortOrder { get; set; }
}

public class PatientReviewModerateCommandHandler : IRequestHandler<PatientReviewModerateCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public PatientReviewModerateCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PortalMutationResult> Handle(PatientReviewModerateCommand request, CancellationToken cancellationToken)
    {
        if (request.Status is not (PatientReviewStatus.Approved or PatientReviewStatus.Rejected))
            throw new ArgumentException("وضعیت نامعتبر است");

        var review = await _db.PatientReviews
            .FirstOrDefaultAsync(x => x.PatientReviewId == request.PatientReviewId, cancellationToken)
            ?? throw new KeyNotFoundException("نظر یافت نشد");

        review.Status = request.Status;
        review.AdminNote = request.AdminNote?.Trim();
        review.ReviewedAt = DateTime.UtcNow;
        review.ReviewedByUserId = _currentUser.UserId;

        if (request.SortOrder.HasValue)
            review.SortOrder = request.SortOrder.Value;

        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = review.PatientReviewId };
    }
}
