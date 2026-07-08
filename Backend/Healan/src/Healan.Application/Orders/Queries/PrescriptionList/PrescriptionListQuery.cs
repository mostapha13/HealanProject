using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using Healan.Application.Orders.Dtos;
using Healan.Application.Patients.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Orders.Queries.PrescriptionList;
public class PrescriptionListQuery : AbstractSearchRequest<PaginatedList<PrescriptionSummaryResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}

public class PrescriptionListQueryHandler : IRequestHandler<PrescriptionListQuery, PaginatedList<PrescriptionSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public PrescriptionListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<PaginatedList<PrescriptionSummaryResult>> Handle(PrescriptionListQuery request, CancellationToken cancellationToken)
    {
        var query =
            _applicationDbContext.Prescriptions
            .Include(x => x.Appointment).ThenInclude(x => x.Patient)
            .Include(x => x.Appointment).ThenInclude(x => x.Doctor)
            .Include(x => x.PrescriptionDrugs)
            .Include(x => x.ImagingRequests).ThenInclude(x => x.ImagingResults)
            .Include(x => x.ImagingRequests).ThenInclude(x => x.Attachment)
            .Include(x => x.LabTestRequests).ThenInclude(x => x.LabTestResults)
            .Include(x => x.LabTestRequests).ThenInclude(x => x.Attachment)
            ;

        return await query.ProjectTo<PrescriptionSummaryResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

    }
}
