using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using Healan.Application.Insurances.Dtos;
using Healan.Domain.Insurances.Enums;
using MediatR;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Insurances.Queries.InsuranceList;
public class InsuranceListQuery : AbstractSearchRequest<PaginatedList<InsuranceSummaryResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public InsuranceTypeId? InsuranceTypeId { get; set; }
}

public class InsuranceListQueryHandler : IRequestHandler<InsuranceListQuery, PaginatedList<InsuranceSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public InsuranceListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<PaginatedList<InsuranceSummaryResult>> Handle(InsuranceListQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.InsuranceCompanies
            .Where(x=>request.InsuranceTypeId!=null?x.InsuranceTypeId==request.InsuranceTypeId:true)
            ;

        return await query.ProjectTo<InsuranceSummaryResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

    }
}
