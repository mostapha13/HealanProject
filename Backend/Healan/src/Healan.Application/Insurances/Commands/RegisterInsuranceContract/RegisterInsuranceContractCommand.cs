using AutoMapper;
using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Interfaces;
using Healan.Application.Insurances.Dtos;
using Healan.Domain.Attachments.Entities;
using Healan.Domain.Insurances.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Exceptions;

namespace Healan.Application.Insurances.Commands.RegisterInsuranceContract;
public class RegisterInsuranceContractCommand : RegisterInsuranceContractRequestDto, IRequest<InsuranceContarctRegisterResult>
{
}
public class RegisterInsuranceContractCommandHandler : IRequestHandler<RegisterInsuranceContractCommand, InsuranceContarctRegisterResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IFileManagerTool _FileManagerTool;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<RegisterInsuranceContractCommandHandler> _logger;

    public RegisterInsuranceContractCommandHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IFileManagerTool fileManagerTool, ICurrentUserService currentUserService, ILogger<RegisterInsuranceContractCommandHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _FileManagerTool = fileManagerTool;
        _currentUserService = currentUserService;
        _logger = logger;
    }


    public async Task<InsuranceContarctRegisterResult> Handle(RegisterInsuranceContractCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));
        var userId = _currentUserService.UserId;
        bool isNew = false;

        var insuranceContract = await _applicationDbContext.InsuranceContracts
            .Include(x => x.InsuranceContractServices)
             .FirstOrDefaultAsync(x => x.InsuranceContractId == request.InsuranceContractId);
        if (insuranceContract == null)
        {
            insuranceContract = new InsuranceContract();
            _applicationDbContext.InsuranceContracts.Add(insuranceContract);
            isNew = true;
        }

        #region قرارداد بیمه
        insuranceContract.InsuranceCompanyId = request.InsuranceCompanyId;
        insuranceContract.ContractNumber = request.ContractNumber;
        insuranceContract.StartDate = request.StartDate;
        insuranceContract.EndDate = request.EndDate;
        insuranceContract.PhoneNumber = request.PhoneNumber;
        insuranceContract.EmailAddress = request.EmailAddress;
        insuranceContract.IsActive = request.IsActive;
        #endregion


        #region LogoId

        if (request.AttachmentId.HasValue)
        {
            if (insuranceContract.AttachmentId != request.AttachmentId)
            {
                var fileInfo = await _FileManagerTool.GetFileReplyInfo(request.AttachmentId.Value);
                insuranceContract.Attachment = new Attachment
                {
                    Link = fileInfo.Link,
                    FileId = request.AttachmentId.Value,
                    FileName = fileInfo.FileName,
                    FileType = fileInfo.FileType,
                    Title = request.ContractNumber ?? request.InsuranceCompanyId.ToString()
                };

                _applicationDbContext.Attachments.Add(insuranceContract.Attachment);
            }

        }

        #endregion

        if (request.InsuranceContractServices.Any())
        {
            foreach (var service in request.InsuranceContractServices)
            {
                if (service.InsuranceContractServiceId is null)
                {
                    insuranceContract.InsuranceContractServices.Add(new InsuranceContractService
                    {
                        ServiceTypeId = service.ServiceTypeId,
                        CoveragePercentage = service.CoveragePercentage,
                        FinalPrice = service.FinalPrice,
                        CoPayment = service.CoPayment,
                        EffectiveFrom = service.EffectiveFrom,
                        EffectiveTo = service.EffectiveTo,
                    });
                }
                else
                {
                    var contract = insuranceContract.InsuranceContractServices
                        .FirstOrDefault(x => x.InsuranceContractServiceId == service.InsuranceContractServiceId);
                    if (contract is null)
                        throw new BadRequestExceptions();

                    contract.ServiceTypeId = service.ServiceTypeId;
                    contract.CoveragePercentage = service.CoveragePercentage;
                    contract.FinalPrice = service.FinalPrice;
                    contract.CoPayment = service.CoPayment;
                    contract.EffectiveFrom = service.EffectiveFrom;
                    contract.EffectiveTo = service.EffectiveTo;
                }

            }
        }

        await _applicationDbContext.SaveChangesAsync(cancellationToken);
        return new InsuranceContarctRegisterResult(Id: insuranceContract.InsuranceContractId);
    }
}
