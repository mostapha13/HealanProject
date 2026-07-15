using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Appointments.Queries.GetAppointmentInfo;

public class GetAppointmentInfoQuery : IRequest<AppointmentInfoResult>
{
    public long AppointmentId { get; set; }
}

public class GetAppointmentInfoQueryHandler : IRequestHandler<GetAppointmentInfoQuery, AppointmentInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IClinicAccessScopeService _clinicAccess;

    public GetAppointmentInfoQueryHandler(
        IApplicationDbContext applicationDbContext,
        IMapper mapper,
        IClinicAccessScopeService clinicAccess)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _clinicAccess = clinicAccess;
    }

    public async Task<AppointmentInfoResult> Handle(GetAppointmentInfoQuery request, CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);

        var result = await _applicationDbContext.Appointments
            .Include(x => x.PrimaryInsuranceCompany)
            .Include(x => x.SecondInsuranceCompany)
            .Include(x => x.ServiceTypes)
            .Include(x => x.Patient)
            .Include(x => x.Doctor)
            .Include(x => x.Invoices).ThenInclude(x => x.InvoiceItems).ThenInclude(x => x.ServiceType)
            .Include(x => x.Prescriptions).ThenInclude(p => p.EchoReport)
            .Where(x => x.AppointmentId == request.AppointmentId)
            .ApplyClinicScope(scope)
            .AsNoTracking()
            .ProjectTo<AppointmentInfoResult>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

        if (result == null)
            throw new NotFoundExceptions("نوبت یافت نشد یا به این نوبت دسترسی ندارید");

        return result;
    }
}
