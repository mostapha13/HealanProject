using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Appointments.Queries.GetAppointmentInfo;
    public class GetAppointmentInfoQuery : IRequest<AppointmentInfoResult>
    {
        public long AppointmentId { get; set; }
    }

public class GetAppointmentInfoQueryHandler : IRequestHandler<GetAppointmentInfoQuery, AppointmentInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public GetAppointmentInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<AppointmentInfoResult> Handle(GetAppointmentInfoQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.Appointments
            .Include(x=>x.PrimaryInsuranceCompany)
            .Include(x=>x.SecondInsuranceCompany)
            .Include(x=>x.ServiceTypes)
            .Include(x => x.Patient)
            .Include(x => x.Doctor)
            .Include(x=>x.Invoices).ThenInclude(x=>x.InvoiceItems).ThenInclude(x=>x.ServiceType)
            .Include(x => x.Prescriptions).ThenInclude(p => p.EchoReport)
            .Where(x => x.AppointmentId == request.AppointmentId)
            .AsNoTracking();
    

        return await query.ProjectTo<AppointmentInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();

    }
}
