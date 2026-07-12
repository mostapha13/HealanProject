using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Portal.Queries.RagKnowledgeList;

public class RagKnowledgeListQuery : AbstractSearchRequest<PaginatedList<RagKnowledgeItemDto>>
{
    public string? FilterText { get; set; }
    public string? Topic { get; set; }
    public bool? IsActive { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}

public class RagKnowledgeListQueryHandler : IRequestHandler<RagKnowledgeListQuery, PaginatedList<RagKnowledgeItemDto>>
{
    private readonly IApplicationDbContext _db;

    public RagKnowledgeListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PaginatedList<RagKnowledgeItemDto>> Handle(RagKnowledgeListQuery request, CancellationToken cancellationToken)
    {
        var query = _db.RagKnowledgeItems.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.FilterText))
        {
            var filter = request.FilterText.Trim();
            query = query.Where(x =>
                x.Question.Contains(filter) ||
                (x.QuestionSummary != null && x.QuestionSummary.Contains(filter)) ||
                (x.Keywords != null && x.Keywords.Contains(filter)) ||
                (x.Topic != null && x.Topic.Contains(filter)) ||
                x.Answer.Contains(filter));
        }

        if (!string.IsNullOrWhiteSpace(request.Topic))
            query = query.Where(x => x.Topic == request.Topic.Trim());

        if (request.IsActive.HasValue)
            query = query.Where(x => x.IsActive == request.IsActive.Value);

        var projected = query
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.Priority)
            .ThenByDescending(x => x.RagKnowledgeItemId)
            .Select(x => new RagKnowledgeItemDto
            {
                RagKnowledgeItemId = x.RagKnowledgeItemId,
                Question = x.Question,
                QuestionSummary = x.QuestionSummary,
                Keywords = x.Keywords,
                Topic = x.Topic,
                Answer = x.Answer,
                SimilarQuestions = x.SimilarQuestions,
                Priority = x.Priority,
                SortOrder = x.SortOrder,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                LastModifiedAt = x.LastModifiedAt,
            });

        return await projected.PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
    }
}
