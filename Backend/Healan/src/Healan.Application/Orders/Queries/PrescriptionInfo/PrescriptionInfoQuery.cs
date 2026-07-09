using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Orders.Dtos;
using Healan.Application.Patients.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Orders.Queries.PrescriptionInfo;
    public class PrescriptionInfoQuery:IRequest<PrescriptionInfoResult>
    {
        public long PrescriptionId { get; set; }
    }

public class PrescriptionInfoQueryHandler : IRequestHandler<PrescriptionInfoQuery, PrescriptionInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public PrescriptionInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<PrescriptionInfoResult> Handle(PrescriptionInfoQuery request, CancellationToken cancellationToken)
    {
        var query =
           _applicationDbContext.Prescriptions
           .Include(x => x.PrescriptionDrugs)
           .Include(x => x.ImagingRequests).ThenInclude(x => x.ImagingResults)
           .Include(x => x.ImagingRequests).ThenInclude(x => x.Attachment)
           .Include(x => x.LabTestRequests).ThenInclude(x => x.LabTestResults)
           .Include(x => x.LabTestRequests).ThenInclude(x => x.Attachment)
           .Include(x => x.EchoReport)
           .AsNoTracking()
           .Where(x=>x.PrescriptionId==request.PrescriptionId)
           ;

        return await query.ProjectTo<PrescriptionInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync(cancellationToken);

    }
}
