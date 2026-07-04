namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessMenu
{

    //public class GetAccessMenuByIdQuery : AbstractRequestBase<AccessMenuResponse>
    //{
    //    public int AccessMenuId { get; set; }
    //}
    //public class GetAccessMenuByIdQueryHandler : IRequestHandler<GetAccessMenuByIdQuery, AccessMenuResponse>
    //{
    //    private readonly IApplicationDbContext _applicationDbContext;
    //    private readonly IMapper _mapper;
    //    public GetAccessMenuByIdQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    //    {
    //        _applicationDbContext = applicationDbContext;
    //        _mapper = mapper;
    //    }
    //    public async Task<AccessMenuResponse> Handle(GetAccessMenuByIdQuery request, CancellationToken cancellationToken)
    //    {
    //        var result = _applicationDbContext.AccessMenus.Where(w => w.AccessMenuId == request.AccessMenuId).ProjectTo<AccessMenuResponse>(_mapper.ConfigurationProvider);
    //        return await result.FirstOrDefaultAsync(cancellationToken);
    //    }
    //}
}
