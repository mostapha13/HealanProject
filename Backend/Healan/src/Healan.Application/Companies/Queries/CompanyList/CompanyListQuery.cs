using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Companies.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Companies.Queries.CompanyList
{
    public class CompanyListQuery : AbstractSearchRequest<PaginatedList<CompanySummaryResult>>
    {
        public string FilterText { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }

    public class CompanyListQueryHandler : IRequestHandler<CompanyListQuery, PaginatedList<CompanySummaryResult>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;

        public CompanyListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }



        public async Task<PaginatedList<CompanySummaryResult>> Handle(CompanyListQuery request, CancellationToken cancellationToken)
        {

            var query = from company in _applicationDbContext.Companies
                        //  .Include(a => a.Attachment)
                        //.Include(x => x.CompanyUsers).ThenInclude(x=>x.Attachment)
                        //.Include(x => x.CompanyUsers).ThenInclude(x=>x.User)
                        //.Include(x=>x.CompanyAttachments).ThenInclude(x=>x.Attachment)
                        .Include(x => x.CompanyRegistrationType)
                        .Include(x => x.ChildCompanies)

                        select company;

            return await query.ProjectTo<CompanySummaryResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

        }
    }
}
