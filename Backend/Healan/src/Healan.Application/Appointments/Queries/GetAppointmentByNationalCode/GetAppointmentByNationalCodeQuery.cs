using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Appointments.Queries.GetAppointmentByNationalCode;
public class GetAppointmentByNationalCodeQuery : IRequest<AppointmentInfoResult>
{
    public string NationalCode { get; set; }
}
public class GetAppointmentByNationalCodeQueryHandler : IRequestHandler<GetAppointmentByNationalCodeQuery, AppointmentInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public GetAppointmentByNationalCodeQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<AppointmentInfoResult> Handle(GetAppointmentByNationalCodeQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.Appointments
       .Include(x => x.ServiceTypes)
       .Include(x => x.Patient)
       .Include(x => x.Doctor)
       .Include(x => x.Invoices).ThenInclude(x => x.InvoiceItems).ThenInclude(x => x.ServiceType)
       .Where(x => x.Patient.NationalCode == request.NationalCode)
       .AsNoTracking();


        return await query.ProjectTo<AppointmentInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();

    }
}
