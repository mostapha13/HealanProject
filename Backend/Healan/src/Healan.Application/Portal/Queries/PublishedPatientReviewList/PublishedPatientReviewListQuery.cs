using Healan.Application.Portal;
using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Portal.Queries.PublishedPatientReviewList;

public class PublishedPatientReviewListQuery : IRequest<PaginatedList<PatientReviewPublicDto>>
{
    public int PageNumber { get; set; } = 1;

    /// <summary>Page size (default 6). Alias: PageCount query param is also accepted by the controller.</summary>
    public int PageSize { get; set; } = 6;

    /// <summary>Optional alias for PageSize (client naming).</summary>
    public int? PageCount { get; set; }
}

/// <summary>Public-safe review DTO (no contact / admin fields).</summary>
public class PatientReviewPublicDto
{
    public long PatientReviewId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string ReviewText { get; set; } = string.Empty;
    public int Rating { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PublishedPatientReviewListQueryHandler
    : IRequestHandler<PublishedPatientReviewListQuery, PaginatedList<PatientReviewPublicDto>>
{
    private readonly IApplicationDbContext _db;

    public PublishedPatientReviewListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<PatientReviewPublicDto>> Handle(
        PublishedPatientReviewListQuery request,
        CancellationToken cancellationToken)
    {
        var pageSize = request.PageCount is > 0 ? request.PageCount.Value : request.PageSize;
        if (pageSize <= 0) pageSize = 6;
        if (pageSize > 20) pageSize = 20;
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;

        var settings = await _db.PortalSiteSettings.AsNoTracking()
            .ToDictionaryAsync(x => x.SettingKey, x => x.SettingValue, StringComparer.OrdinalIgnoreCase, cancellationToken);

        if (!PortalSectionVisibility.IsEnabled(settings, "reviews"))
        {
            return new PaginatedList<PatientReviewPublicDto>(
                new List<PatientReviewPublicDto>(),
                0,
                pageNumber,
                pageSize);
        }

        var projected = _db.PatientReviews.AsNoTracking()
            .Where(x => x.Status == PatientReviewStatus.Approved)
            .OrderByDescending(x => x.ReviewedAt ?? x.CreatedAt)
            .ThenByDescending(x => x.PatientReviewId)
            .Select(x => new PatientReviewPublicDto
            {
                PatientReviewId = x.PatientReviewId,
                DisplayName = x.DisplayName,
                ReviewText = x.ReviewText,
                Rating = x.Rating,
                ReviewedAt = x.ReviewedAt,
                CreatedAt = x.CreatedAt,
            });

        return await projected.PaginatedListAsync(pageNumber, pageSize, cancellationToken);
    }
}
