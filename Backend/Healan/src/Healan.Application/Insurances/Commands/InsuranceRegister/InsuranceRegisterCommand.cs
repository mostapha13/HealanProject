using AutoMapper;
using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Commands.DoctorRegister;
using Healan.Application.Doctors.Dtos;
using Healan.Application.Insurances.Dtos;
using Healan.Domain.Attachments.Entities;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Insurances.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;

namespace Healan.Application.Insurances.Commands.InsuranceRegister;
public class InsuranceRegisterCommand : InsuranceRegisterRequest, IRequest<InsuranceRegisterResult>
{
}

public class InsuranceRegisterCommandHandler : IRequestHandler<InsuranceRegisterCommand, InsuranceRegisterResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IFileManagerTool _FileManagerTool;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<InsuranceRegisterCommandHandler> _logger;

    public InsuranceRegisterCommandHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IFileManagerTool fileManagerTool, ICurrentUserService currentUserService, ILogger<InsuranceRegisterCommandHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _FileManagerTool = fileManagerTool;
        _currentUserService = currentUserService;
        _logger = logger;
    }
    public async Task<InsuranceRegisterResult> Handle(InsuranceRegisterCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));
        var userId = _currentUserService.UserId;
        bool isNew = false;

        var insurance = await _applicationDbContext.InsuranceCompanies
             .FirstOrDefaultAsync(x => x.InsuranceCompanyId == request.InsuranceCompanyId);
        if (insurance == null)
        {
            insurance = new InsuranceCompany();
            _applicationDbContext.InsuranceCompanies.Add(insurance);
            isNew = true;
        }

        #region بیمه
       
        insurance.InsuranceTypeId = request.InsuranceTypeId;
        insurance.Name = request.Name;
        insurance.Code = request.Code;
        insurance.PhoneNumber = request.PhoneNumber;
        insurance.IsActive = request.IsActive ?? insurance.IsActive;
        #endregion


        #region LogoId

        if (request.AttachmentId.HasValue)
        {
            if (insurance.AttachmentId != request.AttachmentId)
            {
                var fileInfo = await _FileManagerTool.GetFileReplyInfo(request.AttachmentId.Value);
                insurance.Attachment = new Attachment
                {
                    Link = fileInfo.Link,
                    FileId = request.AttachmentId.Value,
                    FileName = fileInfo.FileName,
                    FileType = fileInfo.FileType,
                    Title = request.Name
                };

                _applicationDbContext.Attachments.Add(insurance.Attachment);
            }

        }       

        #endregion



        await _applicationDbContext.SaveChangesAsync(cancellationToken);
        return new InsuranceRegisterResult(Id: insurance.InsuranceCompanyId);
    }
}
