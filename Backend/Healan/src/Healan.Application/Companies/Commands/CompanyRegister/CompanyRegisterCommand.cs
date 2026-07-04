using AutoMapper;
using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Interfaces;
using Healan.Application.Companies.Dtos;
using Healan.Domain.Attachments.Entities;
using Healan.Domain.Companies.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;


namespace Healan.Application.Companies.Commands.CompanyRegister;

public class CompanyRegisterCommand : CompanyRegisterRequest, IRequest<CompanyRegisterResult>
{
}

public class CompanyRegisterCommandHandler : IRequestHandler<CompanyRegisterCommand, CompanyRegisterResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IFileManagerTool _FileManagerTool;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<CompanyRegisterCommandHandler> _logger;

    public CompanyRegisterCommandHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IFileManagerTool fileManagerTool, ICurrentUserService currentUserService, ILogger<CompanyRegisterCommandHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _FileManagerTool = fileManagerTool;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<CompanyRegisterResult> Handle(CompanyRegisterCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));
        var userId = _currentUserService.UserId;
        bool isNew = false;

        var company = await _applicationDbContext.Companies.Include(x => x.Attachment)
             .FirstOrDefaultAsync(x => x.CompanyId == request.CompanyId);
        if (company == null)
        {
            company = new Company();
            _applicationDbContext.Companies.Add(company);
            isNew = true;
        }

        #region شرکت

        company.CompanyName = request.CompanyName;
        company.CompanyRegistrationTypeId = request.CompanyRegistrationTypeId;
        company.EstablishmentDate = request.EstablishmentDate;
        company.LatinCompanyName = request.LatinCompanyName;
        company.NationalId = request.NationalId;
        company.RegistrationDate = request.RegistrationDate;
        company.ParentCompanyRef = request.ParentCompanyRef;
        company.Email = request.Email;
        company.Landline = request.Landline;
        company.PrefixNumber = request.PrefixNumber;
        company.RegistrationNumber = request.RegistrationNumber;
        company.WebSite = request.WebSite;
        company.Address = request.Address;


        #endregion

        #region LogoId

        if (request.AttachmentLogo != null)
        {
            if (company.AttachmentId != null && request.AttachmentLogo.FileId != company.AttachmentId)
                company.Attachment.IsDeleted = true;

            if (company.AttachmentId != request.AttachmentLogo.FileId)
            {
                var fileInfo = await _FileManagerTool.GetFileReplyInfo(request.AttachmentLogo.FileId);
                company.Attachment = new Attachment
                {
                    Link = fileInfo.Link,
                    FileId = request.AttachmentLogo.FileId,
                    FileName = fileInfo.FileName,
                    FileType = fileInfo.FileType,
                    Title = request.CompanyName
                };

                _applicationDbContext.Attachments.Add(company.Attachment);
            }

        }
        else if (company.Attachment != null)
            company.Attachment.IsDeleted = true;

        #endregion




        await _applicationDbContext.BeginTransactionAsync();

        try
        {
            await _applicationDbContext.SaveChangesAsync(cancellationToken);

        }
        catch (Exception ex)
        {
            _logger.LogError($"CompanyRegisterCommandHandler exception is: {ex.Message}");
            await _applicationDbContext.RollbackTransactionAsync();
            throw;
        }


        if (request.ChildsRefCompanies == null)
            request.ChildsRefCompanies = new List<int>();
        foreach (var item in request.ChildsRefCompanies)
        {
            var child = await _applicationDbContext.Companies.FirstOrDefaultAsync(a => a.CompanyId == item);
            if (child == null)
                continue;
            child.ParentCompanyRef = company.CompanyId;
        }
        try
        {
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            await _applicationDbContext.CommitTransactionAsync();

            return new CompanyRegisterResult(Id: company.CompanyId);
        }
        catch (Exception ex)
        {
            await _applicationDbContext.RollbackTransactionAsync();
            _logger.LogError($"CompanyRegisterCommandHandler ChildsRefCompanies exception is: {ex.Message}");
            throw;
        }
    }
}