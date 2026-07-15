using AutoMapper;
using AutoMapper.QueryableExtensions;
using IdentityServer.Domain.Data;
using MediatR;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.AminPanel.Queries.AccessForm
{

    public class ListAccessFormQuery : AbstractSearchRequest<PaginatedList<AccessFormResponse>>
    {
        public string? SearchText { get; set; }
    }
    public class ListAccessFormQueryHandler : IRequestHandler<ListAccessFormQuery, PaginatedList<AccessFormResponse>>
    {
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public ListAccessFormQueryHandler(ApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<PaginatedList<AccessFormResponse>> Handle(ListAccessFormQuery request, CancellationToken cancellationToken)
        {
            var result = await _applicationDbContext.AccessForms.Where(w => string.IsNullOrEmpty(request.SearchText) || w.FormTitle.Contains(request.SearchText))
                .ProjectTo<AccessFormResponse>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

            return result;
        }

    }
}
