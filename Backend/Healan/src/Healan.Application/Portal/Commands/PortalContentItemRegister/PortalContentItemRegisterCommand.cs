using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Entities;
using Healan.Domain.Portal.Enums;
using FileManager.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Commands.PortalContentItemRegister;

public class PortalContentItemRegisterCommand : IRequest<PortalMutationResult>
{
    public long? PortalContentItemId { get; set; }
    public PortalSectionType SectionType { get; set; }
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Body { get; set; }
    public string? ImageUrl { get; set; }
    public Guid? ImageFileId { get; set; }
    public string? IconName { get; set; }
    public string? LinkUrl { get; set; }
    public string? Color { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class PortalContentItemRegisterCommandHandler : IRequestHandler<PortalContentItemRegisterCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _fileManagerTool;

    public PortalContentItemRegisterCommandHandler(IApplicationDbContext db, IFileManagerTool fileManagerTool)
    {
        _db = db;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<PortalMutationResult> Handle(PortalContentItemRegisterCommand request, CancellationToken cancellationToken)
    {
        PortalContentItem? item = null;
        if (request.PortalContentItemId is > 0)
        {
            item = await _db.PortalContentItems
                .FirstOrDefaultAsync(x => x.PortalContentItemId == request.PortalContentItemId, cancellationToken);
        }

        if (item == null)
        {
            item = new PortalContentItem();
            _db.PortalContentItems.Add(item);
        }

        item.SectionType = request.SectionType;
        item.Title = request.Title?.Trim();
        item.Subtitle = request.Subtitle?.Trim();
        item.Body = request.Body?.Trim();
        item.ImageFileId = request.ImageFileId;
        item.IconName = request.IconName?.Trim();
        item.LinkUrl = request.LinkUrl?.Trim();
        item.Color = request.Color?.Trim();
        item.SortOrder = request.SortOrder;
        item.IsPublished = request.IsPublished;

        if (request.ImageFileId.HasValue)
        {
            var fileInfo = await _fileManagerTool.GetFileReplyInfo(request.ImageFileId.Value);
            item.ImageUrl = string.IsNullOrWhiteSpace(fileInfo.Link)
                ? request.ImageUrl?.Trim()
                : fileInfo.Link.Trim();
        }
        else
        {
            item.ImageFileId = null;
            item.ImageUrl = request.ImageUrl?.Trim();
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = item.PortalContentItemId };
    }
}
