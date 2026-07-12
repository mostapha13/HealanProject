using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal;
using Healan.Domain.Portal.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.RagKnowledgeRegister;

public class RagKnowledgeRegisterCommand : IRequest<PortalMutationResult>
{
    public long? RagKnowledgeItemId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? QuestionSummary { get; set; }
    public string? Keywords { get; set; }
    public string? Topic { get; set; }
    public string Answer { get; set; } = string.Empty;
    public string? SimilarQuestions { get; set; }
    public int Priority { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class RagKnowledgeRegisterCommandHandler : IRequestHandler<RagKnowledgeRegisterCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;

    public RagKnowledgeRegisterCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<PortalMutationResult> Handle(RagKnowledgeRegisterCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
            throw new BadRequestExceptions("متن سوال الزامی است");
        if (string.IsNullOrWhiteSpace(request.Answer))
            throw new BadRequestExceptions("متن جواب الزامی است");

        RagKnowledgeItem? item = null;
        if (request.RagKnowledgeItemId is > 0)
        {
            item = await _db.RagKnowledgeItems
                .FirstOrDefaultAsync(x => x.RagKnowledgeItemId == request.RagKnowledgeItemId, cancellationToken);
        }

        if (item == null)
        {
            item = new RagKnowledgeItem();
            _db.RagKnowledgeItems.Add(item);
        }

        item.Question = request.Question.Trim();
        item.QuestionSummary = request.QuestionSummary?.Trim();
        item.Keywords = request.Keywords?.Trim();
        item.Topic = request.Topic?.Trim();
        item.Answer = request.Answer.Trim();
        item.SimilarQuestions = request.SimilarQuestions?.Trim();
        item.Priority = request.Priority;
        item.SortOrder = request.SortOrder;
        item.IsActive = request.IsActive;
        item.SearchText = RagSearchTextBuilder.Build(
            item.Question,
            item.QuestionSummary,
            item.Keywords,
            item.Topic,
            item.SimilarQuestions);

        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = item.RagKnowledgeItemId };
    }
}
