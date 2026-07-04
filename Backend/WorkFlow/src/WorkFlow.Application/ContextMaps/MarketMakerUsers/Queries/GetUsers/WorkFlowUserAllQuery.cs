using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Models;
using Share.Domain.Enums;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers
{
    public class WorkFlowUserAllQuery : AbstractRequestBase<List<SimpleWorkFlowUserResponse>>
    {
        public string UserName { get; set; }
        public Guid? WorkFlowUserId { get; set; }
        public WorkFlowUserGroupId? WorkFlowUserGroupId { get; set; }
    }
    public class WorkFlowUserAllQueryHandler : IRequestHandler<WorkFlowUserAllQuery, List<SimpleWorkFlowUserResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public WorkFlowUserAllQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<List<SimpleWorkFlowUserResponse>> Handle(WorkFlowUserAllQuery request, CancellationToken cancellationToken)
        {

            var query = _applicationDbContext
                .WorkFlowUsers.Where(w =>
                (
                string.IsNullOrEmpty(request.UserName) ||
                w.FirstName.Contains(request.UserName) ||
                w.LastName.Contains(request.UserName) ||
                w.PhoneNumber.Contains(request.UserName)
                ) &&
                (
                !request.WorkFlowUserGroupId.HasValue ||
                w.WorkFlowUserGroupId == request.WorkFlowUserGroupId
                ) &&
                (
                !request.WorkFlowUserId.HasValue ||
                w.WorkFlowUserId == request.WorkFlowUserId
                )
                )
                .AsNoTracking();

            var result = await query.ProjectTo<SimpleWorkFlowUserResponse>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);

            foreach (var item in result)
            {
                item.FullName = item.FirstName + " " + item.LastName;
            }
            return result;
        }
    }

}
