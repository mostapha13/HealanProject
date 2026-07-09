using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Appointments.Queries.CurrentAppointmentList;
public class CurrentAppointmentListQuery : AbstractSearchRequest<PaginatedList<AppointmentSummaryResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    
}

public class CurrentAppointmentListQueryHandler : IRequestHandler<CurrentAppointmentListQuery, PaginatedList<AppointmentSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public CurrentAppointmentListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<PaginatedList<AppointmentSummaryResult>> Handle(CurrentAppointmentListQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.Appointments
            .Include(x => x.Invoices)
            .Include(x => x.ServiceTypes)
            .Include(x => x.Patient)
            .Include(x => x.Doctor)
            .Include(x => x.PrimaryInsuranceCompany)
            .Include(x => x.SecondInsuranceCompany)
            .Include(x => x.Prescriptions).ThenInclude(p => p.EchoReport)
            .Where(x =>
             (
          x.AppointmentDate.Date == DateTime.Now.Date
            )
            &&
           (
           string.IsNullOrEmpty(request.FilterText) ||
           x.Patient.NationalCode.Contains(request.FilterText) ||
           x.Patient.FirstName.Contains(request.FilterText) ||
           x.Patient.LastName.Contains(request.FilterText) ||
           x.Doctor.NationalCode.Contains(request.FilterText)        
           ))
            .AsNoTracking()
            ;


        var result = await query.OrderByDescending(x => x.CreatedAt).ProjectTo<AppointmentSummaryResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
        await AppointmentSummaryEnricher.EnrichPatientVisitHistoryFlagsAsync(_applicationDbContext, result.Items, cancellationToken);
        return result;

    }
}
