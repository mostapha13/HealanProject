using AutoMapper;
using AutoMapper.QueryableExtensions;
using IdentityServer.Domain.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Models;
namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessMenu
{

    public class ListAccessMenuQuery : AbstractRequestBase<List<AccessMenuFullResponse>>
    {
        public int AccessSystemId { get; set; }
    }
    public class ListAccessMenuQueryHandler : IRequestHandler<ListAccessMenuQuery, List<AccessMenuFullResponse>>
    {
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public ListAccessMenuQueryHandler(ApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<List<AccessMenuFullResponse>> Handle(ListAccessMenuQuery request, CancellationToken cancellationToken)
        {
            var result = _applicationDbContext.AccessMenus.Include(a => a.AccessForm).Where(w => !w.ParentRef.HasValue && w.AccessForm.AccessSystemId == request.AccessSystemId).OrderBy(o => o.Order)
                .ProjectTo<AccessMenuFullResponse>(_mapper.ConfigurationProvider).ToList();

            foreach (var item in result)
            {
                SetLevel(item, 0);
            }
            return result;
        }
        private void SetLevel(AccessMenuFullResponse mainMenuResponse, int level)
        {
            if (mainMenuResponse == null)
                return;
            level++;
            mainMenuResponse.Level = level;
            if (mainMenuResponse.Children != null)
                foreach (var child in mainMenuResponse.Children)
                {
                    SetLevel(child, mainMenuResponse.Level);
                }
        }
    }
}
