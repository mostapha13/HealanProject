using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Entities;
using Healan.Domain.Portal.Enums;
using MediatR;
using System.Text.RegularExpressions;

namespace Healan.Application.Portal.Commands.PatientReviewSubmit;

public class PatientReviewSubmitCommand : IRequest<PortalMutationResult>
{
    public string DisplayName { get; set; } = string.Empty;
    public string ContactInfo { get; set; } = string.Empty;
    public string ReviewText { get; set; } = string.Empty;
    public int Rating { get; set; }
}

public class PatientReviewSubmitCommandHandler : IRequestHandler<PatientReviewSubmitCommand, PortalMutationResult>
{
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex MobileRegex = new(@"^09\d{9}$", RegexOptions.Compiled);

    private readonly IApplicationDbContext _db;

    public PatientReviewSubmitCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<PortalMutationResult> Handle(PatientReviewSubmitCommand request, CancellationToken cancellationToken)
    {
        var name = request.DisplayName?.Trim() ?? string.Empty;
        var contact = NormalizeContact(request.ContactInfo);
        var text = request.ReviewText?.Trim() ?? string.Empty;

        if (name.Length < 2)
            throw new ArgumentException("نام باید حداقل ۲ کاراکتر باشد");
        if (text.Length < 10)
            throw new ArgumentException("متن نظر باید حداقل ۱۰ کاراکتر باشد");
        if (request.Rating is < 1 or > 5)
            throw new ArgumentException("امتیاز باید بین ۱ تا ۵ باشد");
        if (!IsValidContact(contact))
            throw new ArgumentException("شماره موبایل یا ایمیل معتبر وارد کنید");

        var review = new PatientReview
        {
            DisplayName = name,
            ContactInfo = contact,
            ReviewText = text,
            Rating = request.Rating,
            Status = PatientReviewStatus.Pending,
            SortOrder = 0,
        };

        _db.PatientReviews.Add(review);
        await _db.SaveChangesAsync(cancellationToken);

        return new PortalMutationResult { Id = review.PatientReviewId };
    }

    private static string NormalizeContact(string? value)
    {
        var trimmed = (value ?? string.Empty).Trim();
        var latin = trimmed
            .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2').Replace('۳', '3').Replace('۴', '4')
            .Replace('۵', '5').Replace('۶', '6').Replace('۷', '7').Replace('۸', '8').Replace('۹', '9')
            .Replace(" ", string.Empty);
        return latin;
    }

    private static bool IsValidContact(string contact) =>
        MobileRegex.IsMatch(contact) || EmailRegex.IsMatch(contact);
}
