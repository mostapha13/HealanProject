using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Companies.Dtos;
using Healan.Domain.Invoices.Enums;
using MediatR;
using Share.Domain.Extensions;
using Share.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Appointments.Queries.PaymentMethodTypes;
public class PaymentMethodTypesQuery : IRequest<List<PaymentMethodTypeResult>>
{
}

public class PaymentMethodTypesQueryHandler : IRequestHandler<PaymentMethodTypesQuery, List<PaymentMethodTypeResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public PaymentMethodTypesQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<List<PaymentMethodTypeResult>> Handle(PaymentMethodTypesQuery request, CancellationToken cancellationToken)
    {
        return EnumExtensions.GetEnumInfo<PaymentMethodTypeId>().Select(x=>new PaymentMethodTypeResult
        {
            PaymentMethodTypeId=(PaymentMethodTypeId)x.Key,
            PaymentMethodTypeName=x.DisplayName
        }).ToList();
    }
}