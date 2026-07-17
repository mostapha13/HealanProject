using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Portal.Queries.RagChatLogList;

public class RagChatLogListQuery : AbstractSearchRequest<PaginatedList<RagChatLogDto>>
{
    public string? FilterText { get; set; }
    public string? Phone { get; set; }
    public DateTime? FromUtc { get; set; }
    public DateTime? ToUtc { get; set; }
    public bool? AuthenticatedOnly { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class RagChatLogListQueryHandler : IRequestHandler<RagChatLogListQuery, PaginatedList<RagChatLogDto>>
{
    private readonly IApplicationDbContext _db;

    public RagChatLogListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<RagChatLogDto>> Handle(RagChatLogListQuery request, CancellationToken cancellationToken)
    {
        var query = _db.RagChatLogs.AsNoTracking().AsQueryable();

        if (request.FromUtc.HasValue)
            query = query.Where(x => x.CreatedAt >= request.FromUtc.Value);

        if (request.ToUtc.HasValue)
            query = query.Where(x => x.CreatedAt <= request.ToUtc.Value);

        if (request.AuthenticatedOnly == true)
            query = query.Where(x => x.IdentityUserId != null);
        else if (request.AuthenticatedOnly == false)
            query = query.Where(x => x.IdentityUserId == null);

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone.Trim();
            query = query.Where(x => x.PhoneNumber != null && x.PhoneNumber.Contains(phone));
        }

        if (!string.IsNullOrWhiteSpace(request.FilterText))
        {
            var filter = request.FilterText.Trim();
            query = query.Where(x =>
                x.Question.Contains(filter) ||
                (x.Answer != null && x.Answer.Contains(filter)) ||
                (x.PhoneNumber != null && x.PhoneNumber.Contains(filter)));
        }

        var projected = query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.RagChatLogId)
            .Select(x => new RagChatLogDto
            {
                RagChatLogId = x.RagChatLogId,
                Question = x.Question,
                Answer = x.Answer,
                SimilarityScore = x.SimilarityScore,
                SourceType = x.SourceType,
                SessionId = x.SessionId,
                GuestKey = x.GuestKey,
                IdentityUserId = x.IdentityUserId,
                PhoneNumber = x.PhoneNumber,
                WasAnswered = x.WasAnswered,
                IsAuthenticated = x.IdentityUserId != null,
                CreatedAt = x.CreatedAt,
            });

        return await projected.PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
    }
}
