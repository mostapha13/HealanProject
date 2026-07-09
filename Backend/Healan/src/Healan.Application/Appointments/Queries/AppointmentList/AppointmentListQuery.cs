using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Appointments;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Appointments.Queries.AppointmentList;
public class AppointmentListQuery : AbstractSearchRequest<PaginatedList<AppointmentSummaryResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class AppointmentListQueryHandler : IRequestHandler<AppointmentListQuery, PaginatedList<AppointmentSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public AppointmentListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<PaginatedList<AppointmentSummaryResult>> Handle(AppointmentListQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.Appointments
            .Include(x=>x.Invoices)
            .Include(x => x.ServiceTypes)
            .Include(x => x.Patient)
            .Include(x => x.Doctor)
            .Include(x => x.PrimaryInsuranceCompany)
            .Include(x => x.SecondInsuranceCompany)
            .Include(x => x.Prescriptions).ThenInclude(p => p.EchoReport)
            .Where(x =>
             (
            request.StartDate.HasValue && request.EndDate.HasValue ? x.AppointmentDate >= request.StartDate.Value && x.AppointmentDate <= request.EndDate.Value :
            request.StartDate.HasValue && !request.EndDate.HasValue ? x.AppointmentDate >= request.StartDate.Value :
            !request.StartDate.HasValue && request.EndDate.HasValue ? x.AppointmentDate <= request.EndDate.Value :
            true
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
