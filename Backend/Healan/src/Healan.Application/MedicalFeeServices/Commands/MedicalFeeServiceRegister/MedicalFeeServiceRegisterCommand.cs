using AutoMapper;
using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Interfaces;
using Healan.Application.MedicalFeeServices.Dtos;
using Healan.Domain.MedicalFeeServices.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;

namespace Healan.Application.MedicalFeeServices.Commands.MedicalFeeServiceRegister;
public class MedicalFeeServiceRegisterCommand : MedicalFeeServiceRegisterRequest, IRequest<MedicalFeeServiceRegisterResult>
{
}
public class MedicalFeeServiceRegisterCommandHandler : IRequestHandler<MedicalFeeServiceRegisterCommand, MedicalFeeServiceRegisterResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IFileManagerTool _FileManagerTool;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<MedicalFeeServiceRegisterCommandHandler> _logger;

    public MedicalFeeServiceRegisterCommandHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IFileManagerTool fileManagerTool, ICurrentUserService currentUserService, ILogger<MedicalFeeServiceRegisterCommandHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _FileManagerTool = fileManagerTool;
        _currentUserService = currentUserService;
        _logger = logger;
    }
    public async Task<MedicalFeeServiceRegisterResult> Handle(MedicalFeeServiceRegisterCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));
        var userId = _currentUserService.UserId;
        bool isNew = false;

        var mediacalFeeService = await _applicationDbContext.MedicalFeeServices
             .FirstOrDefaultAsync(x => x.MedicalFeeServiceId == request.MedicalFeeServiceId);

      
        if (mediacalFeeService == null)
        {
            mediacalFeeService = new MedicalFeeService();
            _applicationDbContext.MedicalFeeServices.Add(mediacalFeeService);
            isNew = true;
        }

        #region خدمات

        mediacalFeeService.ServiceTypeId = request.ServiceTypeId;
        mediacalFeeService.StartDate = request.StartDate;
        mediacalFeeService.EndDate = request.EndDate;
        mediacalFeeService.IsActive = request.IsActive;
        mediacalFeeService.Price = request.Price;

        #endregion

        await _applicationDbContext.SaveChangesAsync(cancellationToken);

        return new MedicalFeeServiceRegisterResult(Id: mediacalFeeService.MedicalFeeServiceId);
    }
}
