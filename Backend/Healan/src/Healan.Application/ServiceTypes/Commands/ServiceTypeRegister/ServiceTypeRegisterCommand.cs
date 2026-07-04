using AutoMapper;
using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Commands.DoctorRegister;
using Healan.Application.Doctors.Dtos;
using Healan.Application.ServiceTypes.Dtos;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.MedicalFeeServices.Entities;
using Healan.Domain.MedicalFeeServices.Enums;
using Healan.Domain.PublicInfos.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.ServiceTypes.Commands.ServiceTypeRegister;
public class ServiceTypeRegisterCommand : IRequest<ServiceTypeResult>
{
    public long? ServiceTypeId { get; set; }
    public string Title { get; set; }
    public string? Code { get; set; }
    public CategoryTypeId CategoryTypeId { get; set; }
    public string Description { get; set; }

}



public class ServiceTypeRegisterCommandHandler : IRequestHandler<ServiceTypeRegisterCommand, ServiceTypeResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IFileManagerTool _FileManagerTool;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<ServiceTypeRegisterCommandHandler> _logger;

    public ServiceTypeRegisterCommandHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IFileManagerTool fileManagerTool, ICurrentUserService currentUserService, ILogger<ServiceTypeRegisterCommandHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _FileManagerTool = fileManagerTool;
        _currentUserService = currentUserService;
        _logger = logger;
    }
    public async Task<ServiceTypeResult> Handle(ServiceTypeRegisterCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));
        var userId = _currentUserService.UserId;

        var serviceType = await _applicationDbContext.ServiceTypes
             .FirstOrDefaultAsync(x => x.ServiceTypeId == request.ServiceTypeId);
        if (serviceType == null)
        {
            serviceType = new ServiceType();
            _applicationDbContext.ServiceTypes.Add(serviceType);
        }

        serviceType.Title = request.Title;
        serviceType.Code = request.Code;
        serviceType.CategoryTypeId = request.CategoryTypeId;
        serviceType.Description = request.Description;

        await _applicationDbContext.SaveChangesAsync(cancellationToken);

        return new ServiceTypeResult(Id: serviceType.ServiceTypeId);
    }
}
