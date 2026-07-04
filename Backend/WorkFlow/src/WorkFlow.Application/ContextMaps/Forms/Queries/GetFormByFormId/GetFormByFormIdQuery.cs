using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Forms.Queries.GetFormByFormId
{
    public class GetFormByFormIdQuery : IRequest<FormResponse>
    {
        public FormId FormId { get; set; }
    }

    public class GetFormByFormIdQueryHandler : IRequestHandler<GetFormByFormIdQuery, FormResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;

        public GetFormByFormIdQueryHandler(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }

        public async Task<FormResponse> Handle(GetFormByFormIdQuery request, CancellationToken cancellationToken)
        {
            return await _applicationDbContext.Forms.Where(f => f.FormId == request.FormId).Select(f => new FormResponse
            {
                FormId = (int)f.FormId,
                FormName = f.FormName,
                FormUrl = f.FormUrl,
                BackwardClass = f.BackwardClass,
                ForwardClass = f.ForwardClass
            }).FirstOrDefaultAsync();
        }
    }
}
