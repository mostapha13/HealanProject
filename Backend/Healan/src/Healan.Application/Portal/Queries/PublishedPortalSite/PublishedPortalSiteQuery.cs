using Healan.Application.Portal;
using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Enums;
using FileManager.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.PublishedPortalSite;

public class PublishedPortalSiteQuery : IRequest<PublishedPortalSiteDto>
{
}

public class PublishedPortalSiteQueryHandler : IRequestHandler<PublishedPortalSiteQuery, PublishedPortalSiteDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _fileManagerTool;

    public PublishedPortalSiteQueryHandler(IApplicationDbContext db, IFileManagerTool fileManagerTool)
    {
        _db = db;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<PublishedPortalSiteDto> Handle(PublishedPortalSiteQuery request, CancellationToken cancellationToken)
    {
        var settings = await _db.PortalSiteSettings
            .AsNoTracking()
            .OrderBy(x => x.SettingKey)
            .ToListAsync(cancellationToken);

        var settingsMap = settings.ToDictionary(s => s.SettingKey, s => s.SettingValue, StringComparer.OrdinalIgnoreCase);
        var disabledSections = PortalSectionVisibility.DisabledContentSectionTypes(settingsMap);

        var contentItems = await _db.PortalContentItems
            .AsNoTracking()
            .Where(x => x.IsPublished)
            .OrderBy(x => x.SectionType)
            .ThenBy(x => x.SortOrder)
            .Select(x => new PortalContentItemDto
            {
                PortalContentItemId = x.PortalContentItemId,
                SectionType = x.SectionType,
                Title = x.Title,
                Subtitle = x.Subtitle,
                Body = x.Body,
                ImageUrl = x.ImageUrl,
                ImageFileId = x.ImageFileId,
                IconName = x.IconName,
                LinkUrl = x.LinkUrl,
                Color = x.Color,
                SortOrder = x.SortOrder,
                IsPublished = x.IsPublished,
            })
            .ToListAsync(cancellationToken);

        contentItems = contentItems
            .Where(x => !disabledSections.Contains(x.SectionType.ToString()))
            .ToList();

        await PortalContentImageResolver.ApplyFileLinksAsync(contentItems, _fileManagerTool, cancellationToken);

        var reviews = PortalSectionVisibility.IsEnabled(settingsMap, "reviews")
            ? await _db.PatientReviews
                .AsNoTracking()
                .Where(x => x.Status == PatientReviewStatus.Approved)
                .OrderByDescending(x => x.SortOrder)
                .ThenByDescending(x => x.ReviewedAt)
                .ThenByDescending(x => x.CreatedAt)
                .Select(x => new PatientReviewDto
                {
                    PatientReviewId = x.PatientReviewId,
                    DisplayName = x.DisplayName,
                    ReviewText = x.ReviewText,
                    Rating = x.Rating,
                    Status = x.Status,
                    SortOrder = x.SortOrder,
                    CreatedAt = x.CreatedAt,
                    ReviewedAt = x.ReviewedAt,
                })
                .ToListAsync(cancellationToken)
            : new List<PatientReviewDto>();

        var seoPages = await _db.PortalSeoPages.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Path)
            .Select(x => new PortalSeoPageDto
            {
                PortalSeoPageId = x.PortalSeoPageId,
                PageKey = x.PageKey,
                Path = x.Path,
                Title = x.Title,
                Description = x.Description,
                Keywords = x.Keywords,
                OgTitle = x.OgTitle,
                OgDescription = x.OgDescription,
                OgImageUrl = x.OgImageUrl,
                OgImageFileId = x.OgImageFileId,
                CanonicalUrl = x.CanonicalUrl,
                Robots = x.Robots,
                JsonLdExtra = x.JsonLdExtra,
                IsActive = x.IsActive,
                SortOrder = x.SortOrder,
            })
            .ToListAsync(cancellationToken);

        return new PublishedPortalSiteDto
        {
            Settings = settingsMap,
            ContentItems = contentItems,
            Reviews = reviews,
            SeoPages = seoPages,
        };
    }
}
