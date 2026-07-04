using AutoMapper;
using AutoMapper.QueryableExtensions;
using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Interfaces;
using Healan.Application.Companies.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;

namespace Healan.Application.Companies.Queries.GetCompanyInfo;
public class GetCompanyInfoQuery : IRequest<CompanyInfoResult>
{
    public long CompanyId { get; set; }
}

public class GetCompanyInfoQueryHandler : IRequestHandler<GetCompanyInfoQuery, CompanyInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IFileManagerTool _FileManagerTool;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<GetCompanyInfoQueryHandler> _logger;

    public GetCompanyInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IFileManagerTool fileManagerTool, ICurrentUserService currentUserService, ILogger<GetCompanyInfoQueryHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _FileManagerTool = fileManagerTool;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<CompanyInfoResult> Handle(GetCompanyInfoQuery request, CancellationToken cancellationToken)
    {
        var query = from company in _applicationDbContext.Companies.Where(w => w.CompanyId == request.CompanyId)
                  .Include(a => a.Attachment)           
                  .Include(x => x.CompanyRegistrationType)
                  .Include(x => x.ParentCompany).ThenInclude(x => x.ParentCompany)
                  .Include(x => x.ChildCompanies).ThenInclude(x => x.ChildCompanies)
                    select company;

        return await query.ProjectTo<CompanyInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();
    }
}

