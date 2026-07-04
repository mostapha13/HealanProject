using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Companies.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Companies.Queries.CompanyRegistrationTypes
{
    public class CompanyRegistrationTypesQuery : IRequest<List<CompanyRegistrationTypeResult>>
    {
    }

    public class CompanyRegistrationTypesQueryHandler : IRequestHandler<CompanyRegistrationTypesQuery, List<CompanyRegistrationTypeResult>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;

        public CompanyRegistrationTypesQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<List<CompanyRegistrationTypeResult>> Handle(CompanyRegistrationTypesQuery request, CancellationToken cancellationToken)
        {
            return await _applicationDbContext.CompanyRegistrationTypes.ProjectTo<CompanyRegistrationTypeResult>(_mapper.ConfigurationProvider).ToListAsync();
        }
    }
}
