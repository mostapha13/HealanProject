using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Invoices.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Appointments.Queries.GetInvoice;
    public class GetInvoiceQuery : IRequest<InvoiceInfoResult>
    {
        public long AppointmentId { get; set; }
    }

public class GetInvoiceQueryHandler : IRequestHandler<GetInvoiceQuery, InvoiceInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public GetInvoiceQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<InvoiceInfoResult> Handle(GetInvoiceQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.Invoices
            .Include(x => x.InvoiceItems).ThenInclude(x => x.ServiceType)
            .Include(x => x.Payments)
            .Include(x => x.Appointment)
            .Where(x => x.AppointmentId == request.AppointmentId)
            .AsNoTracking();

        return await query
            .OrderBy(x => x.InvoiceStatusTypeId == InvoiceStatusTypeId.Pending ? 0 : 1)
            .ThenByDescending(x => x.InvoiceId)
            .ProjectTo<InvoiceInfoResult>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

    }
}
