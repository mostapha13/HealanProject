using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.PatientReviewList;

public class PatientReviewListQuery : IRequest<List<PatientReviewDto>>
{
    public PatientReviewStatus? Status { get; set; }
}

public class PatientReviewListQueryHandler : IRequestHandler<PatientReviewListQuery, List<PatientReviewDto>>
{
    private readonly IApplicationDbContext _db;

    public PatientReviewListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<PatientReviewDto>> Handle(PatientReviewListQuery request, CancellationToken cancellationToken)
    {
        var query = _db.PatientReviews.AsNoTracking().AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(x => x.Status == request.Status.Value);

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new PatientReviewDto
            {
                PatientReviewId = x.PatientReviewId,
                DisplayName = x.DisplayName,
                ContactInfo = x.ContactInfo,
                ReviewText = x.ReviewText,
                Rating = x.Rating,
                Status = x.Status,
                SortOrder = x.SortOrder,
                AdminNote = x.AdminNote,
                ReviewedAt = x.ReviewedAt,
                CreatedAt = x.CreatedAt,
            })
            .ToListAsync(cancellationToken);
    }
}
