using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Entities;
using FileManager.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.PortalSeoPageRegister;

public class PortalSeoPageRegisterCommand : IRequest<PortalMutationResult>
{
    public long? PortalSeoPageId { get; set; }
    public string PageKey { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Keywords { get; set; }
    public string? OgTitle { get; set; }
    public string? OgDescription { get; set; }
    public string? OgImageUrl { get; set; }
    public Guid? OgImageFileId { get; set; }
    public string? CanonicalUrl { get; set; }
    public string Robots { get; set; } = "index,follow";
    public string? JsonLdExtra { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public class PortalSeoPageRegisterCommandHandler : IRequestHandler<PortalSeoPageRegisterCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileManagerTool _fileManagerTool;

    public PortalSeoPageRegisterCommandHandler(IApplicationDbContext db, IFileManagerTool fileManagerTool)
    {
        _db = db;
        _fileManagerTool = fileManagerTool;
    }

    public async Task<PortalMutationResult> Handle(PortalSeoPageRegisterCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.PageKey))
            throw new BadRequestExceptions("کلید صفحه الزامی است");
        if (string.IsNullOrWhiteSpace(request.Path))
            throw new BadRequestExceptions("مسیر صفحه الزامی است");
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestExceptions("عنوان SEO الزامی است");

        var pageKey = request.PageKey.Trim().ToLowerInvariant();
        var path = NormalizePath(request.Path);

        PortalSeoPage? row = null;
        if (request.PortalSeoPageId is > 0)
        {
            row = await _db.PortalSeoPages
                .FirstOrDefaultAsync(x => x.PortalSeoPageId == request.PortalSeoPageId, cancellationToken);
        }

        if (row == null)
        {
            row = new PortalSeoPage();
            _db.PortalSeoPages.Add(row);
        }

        if (await _db.PortalSeoPages.AnyAsync(
                x => x.PageKey == pageKey && x.PortalSeoPageId != row.PortalSeoPageId,
                cancellationToken))
            throw new BadRequestExceptions("این کلید صفحه قبلاً ثبت شده است");

        if (await _db.PortalSeoPages.AnyAsync(
                x => x.Path == path && x.PortalSeoPageId != row.PortalSeoPageId,
                cancellationToken))
            throw new BadRequestExceptions("این مسیر صفحه قبلاً ثبت شده است");

        row.PageKey = pageKey;
        row.Path = path;
        row.Title = request.Title.Trim();
        row.Description = request.Description?.Trim();
        row.Keywords = request.Keywords?.Trim();
        row.OgTitle = request.OgTitle?.Trim();
        row.OgDescription = request.OgDescription?.Trim();
        row.CanonicalUrl = request.CanonicalUrl?.Trim();
        row.Robots = string.IsNullOrWhiteSpace(request.Robots) ? "index,follow" : request.Robots.Trim();
        row.JsonLdExtra = request.JsonLdExtra?.Trim();
        row.IsActive = request.IsActive;
        row.SortOrder = request.SortOrder;

        if (request.OgImageFileId.HasValue)
        {
            var fileInfo = await _fileManagerTool.GetFileReplyInfo(request.OgImageFileId.Value);
            row.OgImageFileId = request.OgImageFileId;
            row.OgImageUrl = string.IsNullOrWhiteSpace(fileInfo.Link)
                ? request.OgImageUrl?.Trim()
                : fileInfo.Link.Trim();
        }
        else
        {
            row.OgImageFileId = null;
            row.OgImageUrl = request.OgImageUrl?.Trim();
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = row.PortalSeoPageId };
    }

    private static string NormalizePath(string path)
    {
        var p = path.Trim();
        if (string.IsNullOrEmpty(p)) return "/";
        if (!p.StartsWith('/')) p = "/" + p;
        if (p.Length > 1 && p.EndsWith('/')) p = p.TrimEnd('/');
        return p;
    }
}
