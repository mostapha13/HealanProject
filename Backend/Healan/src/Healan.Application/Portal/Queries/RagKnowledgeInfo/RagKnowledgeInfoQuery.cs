using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Queries.RagKnowledgeInfo;

public class RagKnowledgeInfoQuery : IRequest<RagKnowledgeItemDto>
{
    public long RagKnowledgeItemId { get; set; }
}

public class RagKnowledgeInfoQueryHandler : IRequestHandler<RagKnowledgeInfoQuery, RagKnowledgeItemDto>
{
    private readonly IApplicationDbContext _db;

    public RagKnowledgeInfoQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<RagKnowledgeItemDto> Handle(RagKnowledgeInfoQuery request, CancellationToken cancellationToken)
    {
        var item = await _db.RagKnowledgeItems
            .AsNoTracking()
            .Where(x => x.RagKnowledgeItemId == request.RagKnowledgeItemId)
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
            })
            .FirstOrDefaultAsync(cancellationToken);

        return item ?? throw new NotFoundExceptions("سوال دانش پایه یافت نشد");
    }
}
